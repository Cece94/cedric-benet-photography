"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";

import { EndCredits, clamp01 } from "./parts";

/** Pan ease: the bubble reaches the centre of the screen ahead of the deepest zoom. */
const pan = (p: number) => 1 - (1 - p) ** 2;
/** How far past covering the screen the bubble is blown up, so its rounded ends stay out of sight. */
const OVERSHOOT = 1.4;
/** Flight progress by which the photographs and series titles have gone dark. */
export const WALL_GONE = 0.3;
/**
 * The title takes the bubble's words' place as soon as it pops up, at their
 * size (px on screen), then grows steadily to its full size: one line of
 * text all the way, never two versions of it.
 */
const TITLE_FROM = 12;
/** When the smaller lines under the title fade in, once it is well under way. */
const CREDITS_FADE = [0.55, 0.72];
const fadeIn = ([from, to]: number[], p: number) => clamp01((p - from) / (to - from));

/**
 * The camera flying into the hiker's « Contact me » bubble as the visitor
 * scrolls past the end of the wall (flight: 0 → 1). The farewell page sits
 * inside the bubble all along and grows with it until it fills the screen.
 *
 * Only the lens (the progress line with the hiker standing on it and their
 * bubble: light vector drawings) is zoomed; the photographs and the series
 * titles along the line just go dark. (Blowing up forty large prints left
 * the browser re-rasterising them frame by frame, and they glitched on the
 * way back.)
 */
export function useFlight(flight: MotionValue<number>) {
  // Bubble centre on screen before the flight, and the zoom that makes it cover the screen.
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const depth = useMotionValue(1);
  // The title's starting size, as a share of its full size.
  const titleFrom = useMotionValue(1);
  const [origin, setOrigin] = useState("50% 50%");

  const useFollow = <T,>(fn: (p: number, x: number, y: number, z: number, t: number) => T) =>
    useTransform([flight, aimX, aimY, depth, titleFrom], ([p, x, y, z, t]: number[]) => fn(p, x, y, z, t));
  // How far the bubble has been panned towards the centre of the screen.
  const shiftX = (p: number, x: number) => (window.innerWidth / 2 - x) * pan(p);
  const shiftY = (p: number, y: number) => (window.innerHeight / 2 - y) * pan(p);

  // The lens: zooms around the bubble (exponentially, for a steady feel) while panning it to the centre.
  const lens = {
    x: useFollow((p, x) => shiftX(p, x)),
    y: useFollow((p, _, y) => shiftY(p, y)),
    scale: useFollow((p, _, __, z) => z ** p),
    transformOrigin: origin
  };

  // The photographs and series titles fade into the night as the camera leaves them behind.
  const prints = useFollow(p => clamp01(1 - p / WALL_GONE));

  // The page: a screen-sized card shrunk into the bubble, riding along with it.
  const page = {
    x: useFollow((p, x) => shiftX(p, x) - shiftX(1, x)),
    y: useFollow((p, _, y) => shiftY(p, y) - shiftY(1, y)),
    scale: useFollow((p, _, __, z) => z ** (p - 1)),
    opacity: useFollow(p => (p > 0 ? 1 : 0)),
    pointerEvents: useFollow(p => (p > 0.9 ? "auto" : "none"))
  };

  // The title: from the bubble's word size to full size, growing at its own
  // (slower, steady) pace; the page's own shrink is undone.
  const title = {
    scale: useFollow((p, _, __, z, t) => t ** (1 - p) / z ** (p - 1))
  };
  const credits = { opacity: useFollow(p => fadeIn(CREDITS_FADE, p)) };

  /** Aim at the bubble, from its layout box (unaffected by the camera's own transform). */
  const aim = (bubble: HTMLElement) => {
    let x = 0;
    let y = 0;
    // bubble → hiker → progress line → lens, which fills the viewport
    for (let el: HTMLElement | null = bubble; el && !el.classList.contains("wall__lens"); ) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    // The bubble hangs shifted left by 30% of its width (see .wall__hiker-bubble).
    const cx = x - 0.3 * w + w / 2;
    const cy = y + h / 2;
    aimX.set(cx);
    aimY.set(cy);
    depth.set(OVERSHOOT * Math.max(window.innerWidth / w, window.innerHeight / h));
    setOrigin(`${cx}px ${cy}px`);
    // The title's full size, from the page waiting inside the bubble
    const title = bubble.ownerDocument.querySelector<HTMLElement>(".finale__title");
    const full = title ? parseFloat(getComputedStyle(title).fontSize) : 0;
    if (full) titleFrom.set(TITLE_FROM / full);
  };

  return { lens, prints, page, title, credits, aim };
}

/** The farewell page, living inside the hiker's bubble. */
export function Finale({ camera, open }: { camera: ReturnType<typeof useFlight>; open: boolean }) {
  return (
    <motion.div className="finale" id="contact" style={camera.page} inert={!open} aria-hidden={!open}>
      <motion.p className="finale__title" style={camera.title}>
        Contact me
      </motion.p>
      <motion.div className="finale__credits" style={camera.credits}>
        <EndCredits />
      </motion.div>
    </motion.div>
  );
}
