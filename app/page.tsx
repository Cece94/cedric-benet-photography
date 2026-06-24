"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";

import { CanvasGallery } from "@/components/CanvasGallery";
import { ImmersiveHover } from "@/components/ImmersiveHover";
import { photos } from "@/lib/gallery";

const MOBILE_BREAKPOINT_PX = 900;
const WHEEL_MIN_DELTA = 1;
const TOUCH_MIN_DELTA = 52;
const TOTAL_ITEMS = photos.length * 10;

function toPanFromRatios(xRatio: number, yRatio: number) {
  const cx = Math.max(0, Math.min(1, xRatio));
  const cy = Math.max(0, Math.min(1, yRatio));
  return { x: 14 + cx * 72, y: 16 + cy * 68 };
}

// Returns the pixel distance the track moves per scroll step.
function getStepPx(mobile: boolean): number {
  const vw = window.innerWidth;
  if (mobile) return vw * 0.92;
  return Math.max(240, Math.min(420, vw * 0.22)) + vw * 0.02;
}

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedImageSrc, setExpandedImageSrc] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 50, y: 50 });

  const stepRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const pendingDirRef = useRef<1 | -1 | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isMobileRef = useRef(false);

  // Keep ref in sync so scroll callbacks always read the latest value.
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);

  const xRaw = useMotionValue(0);
  const xSpring = useSpring(xRaw, { stiffness: 55, damping: 16, mass: 0.9 });

  // Realign track on resize.
  useEffect(() => {
    const onResize = () => {
      xRaw.set(-stepRef.current * getStepPx(isMobileRef.current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [xRaw]);

  const advance = useCallback((direction: 1 | -1) => {
    const next = stepRef.current + direction;
    if (next < 0 || next >= TOTAL_ITEMS - 1) return;
    stepRef.current = next;
    xRaw.set(-next * getStepPx(isMobileRef.current));
  }, [xRaw]);

  const flushPending = useCallback(() => {
    frameRef.current = null;
    const dir = pendingDirRef.current;
    pendingDirRef.current = null;
    if (dir !== null) advance(dir);
  }, [advance]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLElement>) => {
    if (expandedImageSrc) return;
    event.preventDefault();
    if (Math.abs(event.deltaY) < WHEEL_MIN_DELTA) return;
    if (hoveredIndex !== null) setHoveredIndex(null);
    pendingDirRef.current = event.deltaY > 0 ? 1 : -1;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(flushPending);
    }
  }, [expandedImageSrc, flushPending, hoveredIndex]);

  const handleTouchStart = useCallback((y: number) => {
    touchStartYRef.current = y;
  }, []);

  const handleTouchMove = useCallback((y: number) => {
    if (!isMobile || expandedImageSrc) return;
    const startY = touchStartYRef.current;
    if (startY === null) return;
    const delta = startY - y;
    if (Math.abs(delta) < TOUCH_MIN_DELTA) return;
    touchStartYRef.current = y;
    pendingDirRef.current = delta > 0 ? 1 : -1;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(flushPending);
    }
  }, [expandedImageSrc, flushPending, isMobile]);

  const hoveredPhoto = hoveredIndex !== null ? photos[hoveredIndex % photos.length] : null;
  const immersiveImageSrc = isMobile ? expandedImageSrc : (hoveredPhoto?.src.src ?? null);

  return (
    <main
      className={`home-page ${hoveredIndex !== null || expandedImageSrc ? "is-hovering-image" : ""} ${isMobile ? "is-mobile" : ""}`}
      onWheel={handleWheel}
      onTouchStart={(e) => handleTouchStart(e.touches[0].clientY)}
      onTouchMove={(e) => {
        handleTouchMove(e.touches[0].clientY);
        if (isMobile && !expandedImageSrc) e.preventDefault();
      }}
      onTouchEnd={() => { touchStartYRef.current = null; }}
    >
      <ImmersiveHover imageSrc={immersiveImageSrc} panX={pan.x} panY={pan.y} />

      <nav className="home-menu" aria-label="Main menu">
        <p className="home-menu__name">Cédric Benet</p>
        <p>Instagram</p>
        <p>A propos</p>
        <p>Contact</p>
      </nav>

      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint__label">Scroll to explore gallery</span>
        <span className="scroll-hint__line" />
      </div>

      {!(isMobile && expandedImageSrc) && (
        <CanvasGallery
          xSpring={xSpring}
          isMobile={isMobile}
          hoveredIndex={hoveredIndex}
          onHoverStart={(index, xr, yr) => {
            if (isMobile) return;
            setHoveredIndex(index);
            setPan(toPanFromRatios(xr, yr));
          }}
          onHoverEnd={() => { if (!isMobile) setHoveredIndex(null); }}
          onHoverMove={(index, xr, yr) => {
            if (hoveredIndex !== index) return;
            setPan(toPanFromRatios(xr, yr));
          }}
          onImageClick={(index) => {
            if (!isMobile) return;
            setExpandedImageSrc(photos[index % photos.length].src.src);
          }}
        />
      )}

      {isMobile && expandedImageSrc && (
        <button
          type="button"
          className="mobile-overlay-close"
          onClick={() => setExpandedImageSrc(null)}
          aria-label="Close image"
        />
      )}
    </main>
  );
}
