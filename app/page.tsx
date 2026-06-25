"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CanvasGallery, type CanvasGalleryHandle } from "@/components/CanvasGallery";
import { photos } from "@/lib/gallery";

export default function HomePage() {
  const [uiStep, setUiStep]     = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const stepRef       = useRef(0);
  const galleryRef    = useRef<CanvasGalleryHandle>(null);
  const frameRef      = useRef<number | null>(null);
  const pendingRef    = useRef<1 | -1 | null>(null);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const mq   = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const advance = useCallback((dir: 1 | -1) => {
    const next = Math.max(0, Math.min(photos.length - 1, stepRef.current + dir));
    if (next === stepRef.current) return;
    stepRef.current = next;
    // Drive the canvas directly — no React re-render in the critical path.
    galleryRef.current?.goTo(next);
    // Update UI labels asynchronously (a frame late is fine for text).
    setUiStep(next);
  }, []);

  const flush = useCallback(() => {
    frameRef.current = null;
    const dir = pendingRef.current;
    pendingRef.current = null;
    if (dir !== null) advance(dir);
  }, [advance]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isZoomed) return; // block navigation while zoomed in
    e.preventDefault();
    if (Math.abs(e.deltaY) < 1) return;
    pendingRef.current = e.deltaY > 0 ? 1 : -1;
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(flush);
  }, [flush, isZoomed]);

  const handleTouchStart = useCallback((y: number) => {
    touchStartRef.current = y;
  }, []);

  const handleTouchMove = useCallback((y: number) => {
    if (isZoomed) return;
    const start = touchStartRef.current;
    if (start === null) return;
    const delta = start - y;
    if (Math.abs(delta) < 52) return;
    touchStartRef.current = y;
    pendingRef.current = delta > 0 ? 1 : -1;
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(flush);
  }, [flush, isZoomed]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const current = photos[uiStep];
  const counter = `${String(uiStep + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;

  return (
    <main
      className={`home-page${isMobile ? " is-mobile" : ""}${isZoomed ? " is-zoomed" : ""}`}
      onWheel={handleWheel}
      onTouchStart={e => handleTouchStart(e.touches[0].clientY)}
      onTouchMove={e => {
        handleTouchMove(e.touches[0].clientY);
        if (isMobile) e.preventDefault();
      }}
      onTouchEnd={() => { touchStartRef.current = null; }}
    >
      <CanvasGallery ref={galleryRef} onZoomChange={setIsZoomed} />

      <nav className="home-menu" aria-label="Main menu">
        <p className="home-menu__name">Cédric Benet</p>
        <p>Instagram</p>
        <p>À propos</p>
        <p>Contact</p>
      </nav>

      {isZoomed && (
        <button
          className="zoom-close"
          onClick={() => galleryRef.current?.exitZoom()}
          aria-label="Fermer"
        />
      )}

      <div key={uiStep} className="photo-meta">
        <span className="photo-meta__series">{current.series}</span>
        <span className="photo-meta__year">{current.year}</span>
      </div>

      <p className="frame-counter">{counter}</p>

      {uiStep < photos.length - 1 && (
        <div className="scroll-hint" aria-hidden="true">
          <span className="scroll-hint__label">Scroll</span>
          <span className="scroll-hint__line" />
        </div>
      )}
    </main>
  );
}
