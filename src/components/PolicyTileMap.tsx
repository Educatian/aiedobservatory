import { useMemo } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import usStatesAtlas from "us-atlas/states-10m.json";
import usCountiesAtlas from "us-atlas/counties-10m.json";
import { formatScoreLabel, getPolicyStrengthBand, getStrengthColor } from "../data/policyData";
import type { PolicyRecord } from "../types";

interface PolicyTileMapProps {
  records: PolicyRecord[];
  selectedState: string;
  visibleIds: Set<string>;
  pulseStates: Set<string>;
  confidenceShiftStates: Set<string>;
  sourceAddedStates: Set<string>;
  playbackState: string | null;
  viewMode: "state" | "district";
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

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY"
};

function normalizeFips(id: string | number | undefined): string | null {
  if (id == null) return null;
  return String(id).padStart(2, "0");
}

function countyFipsToStateFips(id: string | number | undefined): string | null {
  if (id == null) return null;
  return String(id).padStart(5, "0").slice(0, 2);
}

export function PolicyTileMap({
  records,
  selectedState,
  visibleIds,
  pulseStates,
  confidenceShiftStates,
  sourceAddedStates,
  playbackState,
  viewMode,
  onSelect
}: PolicyTileMapProps) {
  const recordsByState = useMemo(
    () => new Map(records.map((record) => [record.stateAbbr, record])),
    [records]
  );

  const projection = useMemo(() => {
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
    const pathGenerator = geoPath(projection);

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
  }, [recordsByState, projection]);

  const districtAtlasData = useMemo(() => {
    if (viewMode !== "district") return null;

    const topology = usCountiesAtlas as unknown as AtlasTopology;
    const countiesObject = topology.objects.counties;
    const statesObject = topology.objects.states;
    const counties = feature(topology as never, countiesObject as never) as AtlasFeatureCollection;
    const stateBorders = mesh(topology as never, statesObject as never, (a: unknown, b: unknown) => a !== b) as unknown as GeoJSON.MultiLineString;
    const nationMesh = mesh(topology as never, statesObject as never, (a: unknown, b: unknown) => a === b) as unknown as GeoJSON.MultiLineString;
    const countyBorders = mesh(topology as never, countiesObject as never, (a: unknown, b: unknown) => a !== b) as unknown as GeoJSON.MultiLineString;
    const pathGenerator = geoPath(projection);

    const countyShapes = counties.features
      .map((f) => {
        const stateFips = countyFipsToStateFips(f.id);
        const stateAbbr = stateFips ? STATE_FIPS_TO_ABBR[stateFips] : undefined;
        if (!stateAbbr) return null;
        const record = recordsByState.get(stateAbbr);
        if (!record) return null;
        const path = pathGenerator(f as never);
        if (!path) return null;
        return { stateAbbr, record, path, countyId: String(f.id) };
      })
      .filter((c): c is NonNullable<typeof c> => c != null);

    return {
      countyShapes,
      stateBorderPath: pathGenerator(stateBorders as never) ?? "",
      countyBorderPath: pathGenerator(countyBorders as never) ?? "",
      nationPath: pathGenerator(nationMesh as never) ?? ""
    };
  }, [viewMode, recordsByState, projection]);

  if (viewMode === "district") {
    const data = districtAtlasData;
    if (!data) return null;

    return (
      <div className="choropleth-shell district-mode" role="img" aria-label="United States county-level policy projection map">
        <svg
          className="choropleth-map"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          aria-hidden="true"
        >
          <g className="map-county-layer">
            {data.countyShapes.map(({ stateAbbr, record, path, countyId }) => {
              const isSelectedState = selectedState === stateAbbr;
              const isVisible = visibleIds.has(stateAbbr);
              const isPulsing = pulseStates.has(stateAbbr);
              const band = getPolicyStrengthBand(record.policyStrength);

              return (
                <path
                  key={countyId}
                  d={path}
                  className={`map-county-shape band-${band}${isSelectedState ? " selected-state" : ""}${isVisible ? "" : " muted"}${isPulsing ? " pulse" : ""}`}
                  style={{
                    fill: getStrengthColor(record.policyStrength, record.snapshotStatus),
                    opacity: isVisible ? 1 : 0.25
                  }}
                  onClick={() => onSelect(stateAbbr)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${record.stateName} county — ${formatScoreLabel(record)}`}
                  aria-pressed={isSelectedState}
                >
                  <title>{`${record.stateName} — ${formatScoreLabel(record)}`}</title>
                </path>
              );
            })}
          </g>

          <path className="map-county-borders" d={data.countyBorderPath} />
          <path className="map-borders district-state-borders" d={data.stateBorderPath} />
          <path className="map-coastline" d={data.nationPath} />
        </svg>

        <div className="district-notice">
          <span className="material-symbols-outlined">info</span>
          County boundaries — district-level policy data not yet coded
        </div>

        <div className="map-hint">
          <span className="material-symbols-outlined">ads_click</span>
          Click a county to inspect its state policy record
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
