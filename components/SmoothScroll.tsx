"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

/** The page's Lenis instance (null until mounted). */
export function useLenis() {
  return useContext(LenisContext);
}

/** Wraps the page with Lenis inertial smooth scrolling. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.4,
      // Gentle exponential ease-out for a gallery-like glide.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Sideways trackpad swipes also walk along the wall.
      gestureOrientation: "both",
      touchMultiplier: 1.6
    });

    let frame: number;
    const raf = (time: number) => {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    queueMicrotask(() => setLenis(instance));

    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
