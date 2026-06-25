"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { photos } from "@/lib/gallery";

const ZOOM_DURATION = 400; // ms

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | ImageBitmap,
  x: number, y: number,
  w: number, h: number,
) {
  if (!source) return;
  if (source instanceof HTMLImageElement && (!source.complete || !source.naturalWidth)) return;
  ctx.drawImage(source, x, y, w, h);
}

export type CanvasGalleryHandle = {
  goTo: (step: number) => void;
  exitZoom: () => void;
};

type Props = {
  onZoomChange?: (zoomed: boolean) => void;
};

export const CanvasGallery = forwardRef<CanvasGalleryHandle, Props>(
  function CanvasGallery({ onZoomChange }, ref) {
    const canvasRef       = useRef<HTMLCanvasElement>(null);
    const imgsRef         = useRef<HTMLImageElement[]>([]);
    const bitmapsRef      = useRef<(ImageBitmap | null)[]>([]);
    const stepRef         = useRef(0);
    const zoomProgressRef = useRef(0);      // 0 = normal, 1 = fully zoomed
    const isZoomedRef     = useRef(false);  // true once zoom-in animation completes
    const zoomRafRef      = useRef<number | null>(null);
    const mouseRef        = useRef({ x: 0.5, y: 0.5 }); // normalized screen position
    const onZoomChangeRef = useRef(onZoomChange);
    useEffect(() => { onZoomChangeRef.current = onZoomChange; }, [onZoomChange]);

    // Compute where to draw the current photo given zoom progress and mouse pan.
    const computeDraw = useCallback((vw: number, vh: number, zp: number) => {
      const idx = stepRef.current;
      // Prefer ImageBitmap (GPU-decoded) over HTMLImageElement.
      const source = bitmapsRef.current[idx] ?? imgsRef.current[idx];
      const img    = imgsRef.current[idx];
      if (!img?.complete || !img.naturalWidth) return null;

      // Normal: object-fit contain in 88% × 78% of screen.
      const maxW = vw * 0.88, maxH = vh * 0.78;
      const ia = img.naturalWidth / img.naturalHeight;
      const ba = maxW / maxH;
      let fw: number, fh: number;
      if (ia > ba) { fw = maxW; fh = maxW / ia; }
      else         { fw = maxH * ia; fh = maxH; }

      // Zoomed: cover full screen, computed from the image's natural aspect ratio
      // so portrait photos scale to fill screen width (not based on small display dims).
      const natIA = img.naturalWidth / img.naturalHeight;
      let fwCover: number, fhCover: number;
      if (natIA > vw / vh) { fhCover = vh; fwCover = vh * natIA; }
      else                 { fwCover = vw; fhCover = vw / natIA; }
      const fwZ = fwCover * 1.12;
      const fhZ = fhCover * 1.12;

      // Interpolate size.
      const drawW = fw + (fwZ - fw) * zp;
      const drawH = fh + (fhZ - fh) * zp;

      // Pan: mouse at center = no offset; edges = max offset.
      // Negated so moving mouse right reveals the right side of the image.
      const maxPanX = Math.max(0, (fwZ - vw) / 2);
      const maxPanY = Math.max(0, (fhZ - vh) / 2);
      const panX = -(mouseRef.current.x - 0.5) * maxPanX * 2 * zp;
      const panY = -(mouseRef.current.y - 0.5) * maxPanY * 2 * zp;

      return { source, x: vw / 2 - drawW / 2 + panX, y: vh / 2 - drawH / 2 + panY, drawW, drawH };
    }, []);

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const vw  = canvas.width  / dpr;
      const vh  = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, vw, vh);

      const d = computeDraw(vw, vh, zoomProgressRef.current);
      if (d) drawPhoto(ctx, d.source, d.x, d.y, d.drawW, d.drawH);
    }, [computeDraw]);

    // Animate zoom in (zoomIn=true) or out (zoomIn=false).
    const startZoom = useCallback((zoomIn: boolean) => {
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current);

      const startProgress = zoomProgressRef.current;
      const startTime     = performance.now();
      // Scale duration so an interrupted animation doesn't feel slow.
      const duration = ZOOM_DURATION * (zoomIn ? 1 - startProgress : startProgress);

      const animate = () => {
        const raw = duration > 0 ? Math.min(1, (performance.now() - startTime) / duration) : 1;
        const e   = easeInOut(raw);
        zoomProgressRef.current = zoomIn
          ? startProgress + e * (1 - startProgress)
          : startProgress - e * startProgress;
        redraw();

        if (raw < 1) {
          zoomRafRef.current = requestAnimationFrame(animate);
        } else {
          zoomRafRef.current  = null;
          zoomProgressRef.current = zoomIn ? 1 : 0;
          isZoomedRef.current     = zoomIn;
          onZoomChangeRef.current?.(zoomIn);
          redraw();
        }
      };
      zoomRafRef.current = requestAnimationFrame(animate);
    }, [redraw]);

    useImperativeHandle(ref, () => ({
      goTo(newStep: number) {
        if (stepRef.current === newStep) return;
        // Exit zoom instantly when navigating to another photo.
        if (zoomProgressRef.current > 0) {
          if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current);
          zoomProgressRef.current = 0;
          isZoomedRef.current     = false;
          onZoomChangeRef.current?.(false);
        }
        stepRef.current = newStep;
        redraw();
      },
      exitZoom() {
        if (zoomProgressRef.current > 0) startZoom(false);
      },
    }), [redraw, startZoom]);

    // Click: zoom in if normal, zoom out if zoomed.
    const handleClick = useCallback(() => {
      if (zoomProgressRef.current > 0.5 || isZoomedRef.current) {
        startZoom(false);
      } else {
        startZoom(true);
      }
    }, [startZoom]);

    // Update mouse for pan (only redraws when image is zoomed in).
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const r = canvasRef.current!.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top)  / r.height,
      };
      if (zoomProgressRef.current > 0) redraw();
    }, [redraw]);

    // Preload images, convert to ImageBitmap (GPU-decoded, zero-copy draws),
    // then warm up by drawing at screen size so the first zoom frame is instant.
    useEffect(() => {
      bitmapsRef.current = new Array(photos.length).fill(null);
      let loaded = 0;

      imgsRef.current = photos.map((photo, i) => {
        const img = new window.Image();
        img.onload = () => {
          const finish = () => { if (++loaded === photos.length) redraw(); };

          if ("createImageBitmap" in window) {
            createImageBitmap(img)
              .then(bm => {
                bitmapsRef.current[i] = bm;
                // Warmup: draw at full display size so GPU has the texture ready.
                try {
                  const vw = window.innerWidth, vh = window.innerHeight;
                  const oc = new OffscreenCanvas(vw, vh);
                  oc.getContext("2d")?.drawImage(bm, 0, 0, vw, vh);
                } catch { /* ignore */ }
                finish();
              })
              .catch(finish);
          } else {
            finish();
          }
        };
        img.src = photo.src.src;
        return img;
      });
    }, [redraw]);

    // Resize canvas buffer on window resize.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = window.innerWidth  * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width  = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        redraw();
      };
      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }, [redraw]);

    return (
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, display: "block" }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
    );
  }
);
