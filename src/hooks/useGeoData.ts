import { useEffect, useState } from "react";

/** Postal codes for the states that have a per-state district TopoJSON in /public/districts. */
const DISTRICT_STATES = new Set(["AL", "CA", "NY", "TX", "WA"]);

export interface DistrictTopology {
  type: "Topology";
  objects: Record<string, unknown>;
  arcs: number[][][];
  transform?: { scale: [number, number]; translate: [number, number] };
}

export interface BroadbandRecord {
  name: string;
  state: string;
  total: number;
  withBroadband: number;
  pct: number | null;
}

export interface BroadbandPayload {
  generatedAt: string;
  source: string;
  metric: string;
  records: Record<string, BroadbandRecord>;
}

/** In-memory cache shared across components. */
const districtCache = new Map<string, DistrictTopology>();
const districtInFlight = new Map<string, Promise<DistrictTopology>>();
let broadbandCache: BroadbandPayload | null = null;
let broadbandInFlight: Promise<BroadbandPayload> | null = null;

export function stateHasDistrictData(stateAbbr: string | null | undefined): boolean {
  return stateAbbr ? DISTRICT_STATES.has(stateAbbr) : false;
}

export function useStateDistricts(stateAbbr: string | null): {
  topology: DistrictTopology | null;
  loading: boolean;
  error: string | null;
} {
  const [topology, setTopology] = useState<DistrictTopology | null>(
    stateAbbr ? districtCache.get(stateAbbr) ?? null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stateAbbr || !DISTRICT_STATES.has(stateAbbr)) {
      setTopology(null);
      setLoading(false);
      setError(null);
      return;
    }
    const cached = districtCache.get(stateAbbr);
    if (cached) {
      setTopology(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    let promise = districtInFlight.get(stateAbbr);
    if (!promise) {
      promise = fetch(`/districts/${stateAbbr}.topo.json`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<DistrictTopology>;
        })
        .then((data) => {
          districtCache.set(stateAbbr, data);
          districtInFlight.delete(stateAbbr);
          return data;
        })
        .catch((err) => {
          districtInFlight.delete(stateAbbr);
          throw err;
        });
      districtInFlight.set(stateAbbr, promise);
    }

    promise
      .then((data) => {
        if (!cancelled) {
          setTopology(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stateAbbr]);

  return { topology, loading, error };
}

export function useBroadband(): {
  data: BroadbandPayload | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<BroadbandPayload | null>(broadbandCache);
  const [loading, setLoading] = useState(!broadbandCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (broadbandCache) {
      setData(broadbandCache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    if (!broadbandInFlight) {
      broadbandInFlight = fetch("/broadband-by-county.json")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<BroadbandPayload>;
        })
        .then((payload) => {
          broadbandCache = payload;
          broadbandInFlight = null;
          return payload;
        })
        .catch((err) => {
          broadbandInFlight = null;
          throw err;
        });
    }

    broadbandInFlight
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
