"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";

import { photos } from "@/lib/gallery";

const TOTAL_ITEMS = photos.length * 10;
const DEG = Math.PI / 180;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

// Same formula as getStepPx in page.tsx — must stay in sync.
function computeStep(vw: number, mobile: boolean): number {
  if (mobile) return vw * 0.92;
  return Math.max(240, Math.min(420, vw * 0.22)) + vw * 0.02;
}

function computeItemW(vw: number, mobile: boolean): number {
  if (mobile) return Math.min(vw * 0.88, 560);
  return Math.max(240, Math.min(420, vw * 0.22));
}

// Returns the smoothstep progress (0 = straight/left, 1 = fully tilted far right).
function getT(centerX: number, vw: number): number {
  const dist = centerX - vw * 0.3;
  if (dist <= 0) return 0;
  return smoothstep(dist / (vw * 1.6));
}

type HitItem = {
  index: number;
  cx: number;
  cy: number;
  hw: number; // half draw-width
  hh: number; // half draw-height
  cosA: number; // cos(-rotZ) for inverse hit transform
  sinA: number; // sin(-rotZ)
};

export type CanvasGalleryProps = {
  xSpring: MotionValue<number>;
  isMobile: boolean;
  hoveredIndex: number | null;
  onHoverStart: (index: number, xr: number, yr: number) => void;
  onHoverEnd: () => void;
  onHoverMove: (index: number, xr: number, yr: number) => void;
  onImageClick: (index: number) => void;
};

export function CanvasGallery({
  xSpring,
  isMobile,
  hoveredIndex,
  onHoverStart,
  onHoverEnd,
  onHoverMove,
  onImageClick,
}: CanvasGalleryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<HTMLImageElement[]>([]);
  const hitRef = useRef<HitItem[]>([]);
  const isMobileRef = useRef(isMobile);
  const hoveredRef = useRef(hoveredIndex);
  const fadeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);
  useEffect(() => { hoveredRef.current = hoveredIndex; }, [hoveredIndex]);

  // Preload all images; trigger a redraw when the last one is ready.
  useEffect(() => {
    let loaded = 0;
    imgsRef.current = photos.map((photo) => {
      const img = new window.Image();
      img.onload = () => {
        loaded++;
        if (loaded === photos.length) redraw();
      };
      img.src = photo.src.src;
      return img;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const vw = canvas.width / dpr;
    const vh = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    const mobile = isMobileRef.current;
    const step = computeStep(vw, mobile);
    const itemW = computeItemW(vw, mobile);
    const itemH = itemW * 1.5; // 2:3 portrait frame
    const pad = vw * 0.05;
    const baseCY = vh * 0.5;
    const trackX = xSpring.get();
    const hovered = hoveredRef.current;
    const fade = fadeRef.current;

    const newHits: HitItem[] = [];

    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const img = imgsRef.current[i % photos.length];
      const cx = trackX + pad + i * step + itemW * 0.5;

      // Generous cull margin so partially tilted cards aren't clipped.
      if (cx + itemW * 2 < 0 || cx - itemW * 2 > vw) continue;

      const t = getT(cx, vw);

      // Same parameters tuned on the CSS branch.
      const rotZ = t * 9 * DEG;
      const sY = 1 - t * 0.35;
      // Combine base X scale with perspective foreshortening (rotateY simulation).
      const sX = (1 - t * 0.12) * Math.cos(t * 18 * DEG);

      const drawW = itemW * sX;
      const drawH = itemH * sY;

      // Dim non-hovered items to near-invisible.
      const itemAlpha = hovered !== null && hovered !== i ? 0.07 : 1;

      ctx.save();
      ctx.translate(cx, baseCY);
      ctx.rotate(rotZ);
      ctx.globalAlpha = fade * itemAlpha;

      // Shadow under the white frame.
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      // White mat frame (same as CSS aspect-ratio + white bg).
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);

      // Draw image with object-fit: contain inside the frame.
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      if (img?.complete && img.naturalWidth > 0) {
        const ia = img.naturalWidth / img.naturalHeight;
        const fa = drawW / drawH;
        let iw = drawW, ih = drawH, ix = -drawW / 2, iy = -drawH / 2;

        if (ia > fa) {
          // Image wider than frame → fit width, white bars top/bottom.
          ih = drawW / ia;
          iy = -ih / 2;
        } else {
          // Image taller → fit height, white bars left/right.
          iw = drawH * ia;
          ix = -iw / 2;
        }

        ctx.drawImage(img, ix, iy, iw, ih);
      }

      ctx.restore();

      newHits.push({
        index: i,
        cx,
        cy: baseCY,
        hw: drawW / 2,
        hh: drawH / 2,
        cosA: Math.cos(-rotZ),
        sinA: Math.sin(-rotZ),
      });
    }

    hitRef.current = newHits;
  }, [xSpring]);

  // Initial fade-in over 700 ms.
  useEffect(() => {
    const DURATION = 700;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      fadeRef.current = Math.min(1, (ts - start) / DURATION);
      redraw();
      if (fadeRef.current < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [redraw]);

  // Redraw on every scroll frame.
  useMotionValueEvent(xSpring, "change", redraw);

  // Redraw when hover state changes.
  useEffect(() => { redraw(); }, [hoveredIndex, redraw]);

  // Resize the canvas physical pixel buffer on window resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  // Returns the topmost hit item under screen point (mx, my).
  const hitTest = useCallback((mx: number, my: number): HitItem | null => {
    const hits = hitRef.current;
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i];
      const dx = mx - h.cx;
      const dy = my - h.cy;
      // Rotate point into the item's local (un-rotated) space.
      const lx = dx * h.cosA - dy * h.sinA;
      const ly = dx * h.sinA + dy * h.cosA;
      if (Math.abs(lx) <= h.hw && Math.abs(ly) <= h.hh) return h;
    }
    return null;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMobile) return;
    const r = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const hit = hitTest(mx, my);
    if (hit) {
      const xr = Math.max(0, Math.min(1, (mx - (hit.cx - hit.hw)) / (hit.hw * 2)));
      const yr = Math.max(0, Math.min(1, (my - (hit.cy - hit.hh)) / (hit.hh * 2)));
      if (hoveredIndex !== hit.index) onHoverStart(hit.index, xr, yr);
      else onHoverMove(hit.index, xr, yr);
    } else if (hoveredIndex !== null) {
      onHoverEnd();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (hit) onImageClick(hit.index);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        display: "block",
        cursor: hoveredIndex !== null ? "crosshair" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (!isMobile) onHoverEnd(); }}
      onClick={handleClick}
    />
  );
}
