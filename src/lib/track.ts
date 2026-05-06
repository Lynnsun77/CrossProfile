export type TrackPayload = Record<string, unknown>;

// Lightweight tracker wrapper for the demo.
// If the host page injects `window.__track`, we forward events to it.
export function track(event: string, payload?: TrackPayload) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: TrackPayload) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

