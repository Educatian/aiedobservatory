import { useMemo } from "react";
import { geoAlbersUsa, geoPath, geoMercator } from "d3-geo";
import { feature, mesh } from "topojson-client";
import usStatesAtlas from "us-atlas/states-10m.json";
import usCountiesAtlas from "us-atlas/counties-10m.json";
import { formatScoreLabel, getPolicyStrengthBand, getStrengthColor } from "../data/policyData";
import type { PolicyRecord } from "../types";
import {
  useBroadband,
  useStateDistricts,
  stateHasDistrictData,
  type DistrictTopology,
  type BroadbandPayload
} from "../hooks/useGeoData";

interface PolicyTileMapProps {
  records: PolicyRecord[];
  selectedState: string;
  visibleIds: Set<string>;
  pulseStates: Set<string>;
  confidenceShiftStates: Set<string>;
  sourceAddedStates: Set<string>;
  playbackState: string | null;
  viewMode: "state" | "district";
  showBroadbandOverlay?: boolean;
  broadbandPatternHatched?: boolean;
  onSelect: (stateAbbr: string) => void;
}

interface AtlasFeature {
  type: "Feature";
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry: GeoJSON.Geometry;
}

interface AtlasFeatureCollection {
  type: "FeatureCollection";
  features: AtlasFeature[];
}

interface AtlasTopologyObject {
  type: string;
  arcs?: number[][] | number[][][];
  id?: string | number;
  properties?: Record<string, unknown>;
  geometries?: Array<{
    type: string;
    id?: string | number;
    properties?: Record<string, unknown>;
    arcs?: number[][] | number[][][];
  }>;
}

interface AtlasTopology {
  type: "Topology";
  objects: Record<string, AtlasTopologyObject>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
}

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 600;

/** Threshold at which a county is considered broadband-deficient. Below this, desaturate / hatch. */
const BROADBAND_THRESHOLD = 0.85;

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY"
};

const STATE_ABBR_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FIPS_TO_ABBR).map(([fips, abbr]) => [abbr, fips])
);

function normalizeFips(id: string | number | undefined): string | null {
  if (id == null) return null;
  return String(id).padStart(2, "0");
}

function countyFipsToStateFips(id: string | number | undefined): string | null {
  if (id == null) return null;
  return String(id).padStart(5, "0").slice(0, 2);
}

/** Mix a hex color toward gray by ratio (0 = unchanged, 1 = full gray). */
function desaturateColor(hex: string, ratio: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const gray = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
  const mix = (c: number) => Math.round(c + (gray - c) * ratio);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/**
 * Given a county GEOID and the broadband payload, return its subscription pct (0–1)
 * or null if unknown.
 */
function broadbandPct(countyGeoid: string, broadband: BroadbandPayload | null): number | null {
  if (!broadband) return null;
  const r = broadband.records[countyGeoid.padStart(5, "0")];
  return r?.pct ?? null;
}

/**
 * For a district, compute a broadband pct by spatially intersecting its bbox
 * with the county centroids. For MVP we use a coarse proxy: just take the
 * GEOID's first 5 chars... wait — district GEOIDs do NOT encode county. So
 * we need a bbox-overlay or attach broadband via zip-code. For the MVP we
 * approximate by taking the broadband pct of the state's population-weighted
 * average; the district layer gets one pct value per *county* it overlaps
 * which we cannot compute client-side without county geometries.
 *
 * Pragmatic MVP choice: broadband overlay is rendered on the *county layer*
 * beneath the districts, not on districts themselves. Districts show policy
 * color; counties show broadband desaturation. This is exactly the common
 * academic convention and keeps the data joins honest.
 */

export function PolicyTileMap({
  records,
  selectedState,
  visibleIds,
  pulseStates,
  confidenceShiftStates,
  sourceAddedStates,
  playbackState,
  viewMode,
  showBroadbandOverlay = false,
  broadbandPatternHatched = false,
  onSelect
}: PolicyTileMapProps) {
  const recordsByState = useMemo(
    () => new Map(records.map((record) => [record.stateAbbr, record])),
    [records]
  );

  // Base national projection (AlbersUSA) for the state view.
  const nationalProjection = useMemo(() => {
    const topology = usStatesAtlas as unknown as AtlasTopology;
    const statesObj = topology.objects.states;
    const states = feature(topology as never, statesObj as never) as AtlasFeatureCollection;
    return geoAlbersUsa().fitExtent(
      [[32, 24], [VIEWBOX_WIDTH - 32, VIEWBOX_HEIGHT - 28]],
      states as never
    );
  }, []);

  const stateAtlasData = useMemo(() => {
    const topology = usStatesAtlas as unknown as AtlasTopology;
    const statesObject = topology.objects.states;
    const states = feature(topology as never, statesObject as never) as AtlasFeatureCollection;
    const borders = mesh(topology as never, statesObject as never, (a, b) => a !== b) as GeoJSON.MultiLineString;
    const nationMesh = mesh(topology as never, statesObject as never, (a, b) => a === b) as GeoJSON.MultiLineString;
    const pathGenerator = geoPath(nationalProjection);

    const stateShapes = states.features
      .map((f) => {
        const fips = normalizeFips(f.id);
        const stateAbbr = fips ? STATE_FIPS_TO_ABBR[fips] : undefined;
        if (!stateAbbr) return null;
        const record = recordsByState.get(stateAbbr);
        if (!record) return null;
        const path = pathGenerator(f as never);
        if (!path) return null;
        const centroid = pathGenerator.centroid(f as never);
        return {
          abbr: stateAbbr,
          record,
          path,
          centroid: Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? centroid : null
        };
      })
      .filter((s): s is NonNullable<typeof s> => s != null);

    return {
      borderPath: pathGenerator(borders as never) ?? "",
      nationPath: pathGenerator(nationMesh as never) ?? "",
      stateShapes
    };
  }, [recordsByState, nationalProjection]);

  // District mode: lazy-load the selected state's district TopoJSON + broadband.
  const districtState = viewMode === "district" && stateHasDistrictData(selectedState)
    ? selectedState
    : null;

  const { topology: districtTopology, loading: districtLoading, error: districtError } =
    useStateDistricts(districtState);
  const { data: broadband } = useBroadband();

  // Build the district view (state-level zoom + real school districts).
  const districtAtlasData = useMemo(() => {
    if (viewMode !== "district") return null;
    if (!districtState || !districtTopology) return null;

    const topology = districtTopology as unknown as AtlasTopology;
    const layerName = Object.keys(topology.objects).find((k) => k.startsWith("districts_"));
    if (!layerName) return null;
    const districtsObject = topology.objects[layerName];
    const districtFc = feature(topology as never, districtsObject as never) as AtlasFeatureCollection;

    // Fit a fresh Mercator projection to just this state's districts.
    const projection = geoMercator().fitExtent(
      [[24, 24], [VIEWBOX_WIDTH - 24, VIEWBOX_HEIGHT - 24]],
      districtFc as never
    );
    const pathGenerator = geoPath(projection);
    const districtBorders = mesh(
      topology as never,
      districtsObject as never,
      (a: unknown, b: unknown) => a !== b
    ) as unknown as GeoJSON.MultiLineString;

    // Also bring in county shapes for the selected state to serve as the broadband base layer.
    const usTopology = usCountiesAtlas as unknown as AtlasTopology;
    const countiesObject = usTopology.objects.counties;
    const countiesFc = feature(usTopology as never, countiesObject as never) as AtlasFeatureCollection;
    const stateFips = STATE_ABBR_TO_FIPS[districtState];
    const stateCounties = countiesFc.features.filter(
      (f) => countyFipsToStateFips(f.id) === stateFips
    );

    const districtShapes = districtFc.features
      .map((f) => {
        const props = (f.properties ?? {}) as { GEOID?: string; NAME?: string };
        const path = pathGenerator(f as never);
        if (!path) return null;
        return {
          geoid: props.GEOID ?? String(f.id ?? ""),
          name: props.NAME ?? "District",
          path
        };
      })
      .filter((d): d is NonNullable<typeof d> => d != null);

    const countyShapes = stateCounties
      .map((f) => {
        const geoid = String(f.id ?? "").padStart(5, "0");
        const path = pathGenerator(f as never);
        if (!path) return null;
        const pct = broadbandPct(geoid, broadband);
        return { geoid, path, pct };
      })
      .filter((c): c is NonNullable<typeof c> => c != null);

    return {
      districtShapes,
      districtBorderPath: pathGenerator(districtBorders as never) ?? "",
      countyShapes
    };
  }, [viewMode, districtState, districtTopology, broadband]);

  if (viewMode === "district") {
    // District but no MVP data: fall back to the national state-view with a notice.
    if (!districtState) {
      return (
        <div className="choropleth-shell district-mode" role="img" aria-label="District mode needs a supported state">
          <div className="district-placeholder">
            <span className="material-symbols-outlined">map</span>
            <div>
              <strong>District view available for Alabama, California, New York, Texas, Washington.</strong>
              <p>Select one of these states to zoom into its school-district boundaries.</p>
            </div>
          </div>
        </div>
      );
    }

    if (districtLoading || !districtAtlasData) {
      return (
        <div className="choropleth-shell district-mode" role="img" aria-label="Loading districts">
          <div className="district-placeholder">
            <span className="material-symbols-outlined spinning">progress_activity</span>
            <div><strong>Loading {selectedState} school districts…</strong></div>
          </div>
        </div>
      );
    }

    if (districtError) {
      return (
        <div className="choropleth-shell district-mode" role="img" aria-label="District load failed">
          <div className="district-placeholder">
            <span className="material-symbols-outlined">error</span>
            <div><strong>Couldn't load districts:</strong> {districtError}</div>
          </div>
        </div>
      );
    }

    const record = recordsByState.get(districtState);
    const baseColor = record
      ? getStrengthColor(record.policyStrength, record.snapshotStatus)
      : "#cbd5f5";
    const band = record ? getPolicyStrengthBand(record.policyStrength) : "uncoded";

    return (
      <div
        className={`choropleth-shell district-mode ${showBroadbandOverlay ? "bb-overlay" : ""}`}
        role="img"
        aria-label={`${record?.stateName ?? districtState} school districts`}
      >
        <svg
          className="choropleth-map"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          aria-hidden="true"
        >
          <defs>
            {/* Diagonal hatch pattern for broadband-deficient counties. */}
            <pattern id="bb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="transparent" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#0f172a" strokeWidth="1.1" opacity="0.55" />
            </pattern>
          </defs>

          {/* Layer 1: broadband-colored counties (beneath districts). */}
          {showBroadbandOverlay && (
            <g className="map-broadband-layer">
              {districtAtlasData.countyShapes.map(({ geoid, path, pct }) => {
                const deficit = pct == null ? 0 : Math.max(0, BROADBAND_THRESHOLD - pct);
                const desatRatio = Math.min(0.85, deficit * 3); // 0 at threshold, full by -28pp
                const fill =
                  pct == null
                    ? "#e2e8f0"
                    : desaturateColor(baseColor, desatRatio);
                return (
                  <path
                    key={`bb-${geoid}`}
                    d={path}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.35}
                    opacity={pct == null ? 0.25 : 0.9}
                  >
                    <title>
                      {pct == null
                        ? "County — broadband data unavailable"
                        : `${broadband?.records[geoid]?.name ?? "County"} — ${Math.round((pct ?? 0) * 100)}% households w/ broadband`}
                    </title>
                  </path>
                );
              })}
              {broadbandPatternHatched && districtAtlasData.countyShapes
                .filter(({ pct }) => pct != null && pct < BROADBAND_THRESHOLD)
                .map(({ geoid, path }) => (
                  <path
                    key={`hatch-${geoid}`}
                    d={path}
                    fill="url(#bb-hatch)"
                    stroke="none"
                    pointerEvents="none"
                  />
                ))}
            </g>
          )}

          {/* Layer 2: school districts themselves (the policy unit). */}
          <g className="map-district-layer">
            {districtAtlasData.districtShapes.map(({ geoid, name, path }) => (
              <path
                key={geoid}
                d={path}
                fill={showBroadbandOverlay ? "transparent" : baseColor}
                stroke="#0f172a"
                strokeWidth={0.35}
                className={`map-district-shape band-${band}`}
                onClick={() => record && onSelect(record.stateAbbr)}
                tabIndex={-1}
              >
                <title>{`${name}`}</title>
              </path>
            ))}
          </g>

          <path
            className="map-district-borders"
            d={districtAtlasData.districtBorderPath}
            fill="none"
            stroke="#0f172a"
            strokeWidth={0.4}
            strokeOpacity={0.55}
          />
        </svg>

        <div className="district-notice">
          <span className="material-symbols-outlined">school</span>
          {districtAtlasData.districtShapes.length} school districts in {record?.stateName ?? districtState}
          {showBroadbandOverlay && broadband
            ? ` · household broadband % (ACS 2023 B28002)`
            : ""}
        </div>

        <div className="map-hint">
          <span className="material-symbols-outlined">ads_click</span>
          Click a district to open the state policy record
        </div>
      </div>
    );
  }

  return (
    <div className="choropleth-shell" role="img" aria-label="United States policy strength map">
      <svg
        className="choropleth-map"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        aria-hidden="true"
      >
        <g className="map-state-layer">
          {stateAtlasData.stateShapes.map(({ abbr, record, path, centroid }) => {
            const isSelected = selectedState === abbr;
            const isVisible = visibleIds.has(abbr);
            const isPulsing = pulseStates.has(abbr);
            const hasConfidenceShift = confidenceShiftStates.has(abbr);
            const hasSourceAdded = sourceAddedStates.has(abbr);
            const isPlaybackFocused = playbackState === abbr;
            const band = getPolicyStrengthBand(record.policyStrength);
            const labelEligible =
              centroid != null &&
              isVisible &&
              (isSelected || ["CA", "TX", "FL", "NY", "WA", "NC", "UT", "PA", "MN"].includes(abbr));

            return (
              <g
                key={abbr}
                className={`map-state-group ${isSelected ? "selected" : ""} ${isVisible ? "" : "muted"} ${isPulsing ? "pulse" : ""} ${hasConfidenceShift ? "confidence-shift" : ""} ${isPlaybackFocused ? "playback-focus" : ""}`}
              >
                <path
                  d={path}
                  className={`map-state-shape band-${band} route-${record.approvalRoute ?? "unknown"}`}
                  style={{ fill: getStrengthColor(record.policyStrength, record.snapshotStatus) }}
                  onClick={() => onSelect(abbr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(abbr);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${record.stateName} ${formatScoreLabel(record)}`}
                  aria-pressed={isSelected}
                >
                  <title>{`${record.stateName} - ${formatScoreLabel(record)} - ${record.approvalRoute ?? "queued"}`}</title>
                </path>

                {hasSourceAdded && centroid ? (
                  <g className="map-source-beacon" transform={`translate(${centroid[0] + 24}, ${centroid[1] - 18})`}>
                    <circle r="10" />
                    <text textAnchor="middle" dy="0.35em">+</text>
                  </g>
                ) : null}

                {labelEligible && centroid ? (
                  <g className="map-label" transform={`translate(${centroid[0]}, ${centroid[1]})`}>
                    <text className="map-label-abbr" textAnchor="middle" dy="-0.15em">{abbr}</text>
                    <text className="map-label-score" textAnchor="middle" dy="1.1em">{formatScoreLabel(record)}</text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>

        <path className="map-borders" d={stateAtlasData.borderPath} />
        <path className="map-coastline" d={stateAtlasData.nationPath} />
      </svg>

      <div className="map-hint">
        <span className="material-symbols-outlined">ads_click</span>
        Click a state to inspect its policy record
      </div>
    </div>
  );
}
