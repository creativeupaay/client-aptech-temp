import { useState, useEffect } from "react";

/**
 * useDelayedLoading
 *
 * Prevents UI "flicker" or "jerk" for fast loading states:
 * - If `isLoading` resolves within `delayMs` (default 250ms), the loader is never shown.
 * - If `isLoading` persists beyond `delayMs`, the loader turns on smoothly.
 * - Once `isLoading` becomes false, the loader immediately turns off.
 *
 * @param isLoading - Current loading state (e.g. from RTK Query / auth check)
 * @param delayMs - Milliseconds threshold before showing spinner (default: 250)
 * @returns boolean indicating whether the loader should be displayed
 */
export function useDelayedLoading(isLoading: boolean, delayMs: number = 250): boolean {
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      setShouldShow(false);
      return;
    }

    const timer = setTimeout(() => {
      setShouldShow(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return shouldShow;
}
