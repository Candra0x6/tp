import { useState, useEffect } from 'react';

export interface BoardState {
  code: string;
  runKey: string;
  delegated: boolean;
  fqdn: string | null;
  run: {
    code: number[];
    host: string;
    players: string[];
    playerCount: number;
    depth: number;
    doors: number;
    floor: number;
    phase: number;
    vrfState: number;
    cleared: number;
    outcome: number;
    deadlineTs: number;
    stake: string;
    pot: string;
  };
  ownClueMask: number | null;
  players: string[];
  timestamp: number;
}

export function useRunObserver(code: string | null, seat: number = 0) {
  const [state, setState] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setState(null);
      return;
    }

    let active = true;
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/runs/${code}?seat=${seat}`);
        if (!res.ok) {
          if (active) setError(`HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        if (active) {
          setState(data);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) setError(err.message ?? 'Fetch failed');
      }
    };

    setLoading(true);
    fetchState();
    const timer = setInterval(fetchState, 800);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [code, seat]);

  return { state, loading, error };
}
