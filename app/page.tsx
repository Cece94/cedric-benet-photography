"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";

import { GalleryStage, type StageSlot } from "@/components/GalleryStage";
import { ImmersiveHover } from "@/components/ImmersiveHover";
import { photos, slotLayouts } from "@/lib/gallery";

type SceneState = {
  slots: StageSlot[];
  nextImageIndex: number;
  stepCount: number;
};

const DESKTOP_SLOT_COUNT = 5;
const MOBILE_SLOT_COUNT = 1;
const MOBILE_BREAKPOINT_PX = 900;
const WHEEL_MIN_DELTA = 1;
const TOUCH_MIN_DELTA = 18;

function toPanFromRatios(xRatio: number, yRatio: number) {
  const clampedX = Math.max(0, Math.min(1, xRatio));
  const clampedY = Math.max(0, Math.min(1, yRatio));

  return {
    x: 14 + clampedX * 72,
    y: 16 + clampedY * 68
  };
}

function getInitialState(slotCount: number): SceneState {
  const initialSlots: StageSlot[] = Array.from({ length: slotCount }, (_, index) => ({
    id: index,
    imageIndex: index % photos.length,
    // Keep one dedicated lane per slot to prevent layout overlap.
    layoutIndex: index % slotLayouts.length,
    version: 0
  }));

  return {
    slots: initialSlots,
    nextImageIndex: slotCount % photos.length,
    stepCount: 0
  };
}

function cloneScene(scene: SceneState): SceneState {
  return {
    slots: scene.slots.map((slot) => ({ ...slot })),
    nextImageIndex: scene.nextImageIndex,
    stepCount: scene.stepCount
  };
}

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const slotCount = isMobile ? MOBILE_SLOT_COUNT : DESKTOP_SLOT_COUNT;

  const [scene, setScene] = useState<SceneState>(() => getInitialState(DESKTOP_SLOT_COUNT));
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const [expandedImageSrc, setExpandedImageSrc] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 50, y: 50 });

  const historyRef = useRef<SceneState[]>([]);
  const pendingDirectionRef = useRef<1 | -1 | null>(null);
  const frameRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const advanceScene = useCallback((direction: 1 | -1) => {
    setScene((previous) => {
      if (direction === -1) {
        const restored = historyRef.current.pop();
        return restored ?? previous;
      }

      // Save one step before replacing the next slot.
      historyRef.current.push(cloneScene(previous));

      const targetSlotId = previous.stepCount % slotCount;
      const updatedSlots = previous.slots.map((slot) => {
        if (slot.id !== targetSlotId) {
          return slot;
        }

        return {
          ...slot,
          imageIndex: previous.nextImageIndex,
          version: slot.version + 1
        };
      });

      return {
        slots: updatedSlots,
        nextImageIndex: (previous.nextImageIndex + 1) % photos.length,
        stepCount: previous.stepCount + 1
      };
    });
  }, [slotCount]);

  const flushPendingScroll = useCallback(() => {
    frameRef.current = null;
    const direction = pendingDirectionRef.current;
    pendingDirectionRef.current = null;
    if (direction === null) {
      return;
    }

    advanceScene(direction);
  }, [advanceScene]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const syncViewportMode = () => {
      setIsMobile(mediaQuery.matches);
    };
    syncViewportMode();
    mediaQuery.addEventListener("change", syncViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Preload only upcoming images to keep swaps instant without network spikes.
    const nextPhoto = photos[scene.nextImageIndex];
    const afterNextPhoto = photos[(scene.nextImageIndex + 1) % photos.length];
    [nextPhoto, afterNextPhoto].forEach((photo) => {
      const img = new window.Image();
      img.src = photo.src.src;
    });
  }, [scene.nextImageIndex]);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (expandedImageSrc) {
        return;
      }

      event.preventDefault();
      if (Math.abs(event.deltaY) < WHEEL_MIN_DELTA) {
        return;
      }

      if (hoveredSlotId !== null) {
        setHoveredSlotId(null);
      }

      pendingDirectionRef.current = event.deltaY > 0 ? 1 : -1;
      if (frameRef.current === null) {
        // Process once per frame to stay instant while avoiding render floods.
        frameRef.current = window.requestAnimationFrame(flushPendingScroll);
      }
    },
    [expandedImageSrc, flushPendingScroll, hoveredSlotId]
  );

  const hoveredImageSrc = useMemo(() => {
    if (hoveredSlotId === null) {
      return null;
    }

    const hoveredSlot = scene.slots.find((slot) => slot.id === hoveredSlotId);
    return hoveredSlot ? photos[hoveredSlot.imageIndex].src.src : null;
  }, [hoveredSlotId, scene.slots]);

  const handleHoverMove = useCallback((slotId: number, xRatio: number, yRatio: number) => {
    if (hoveredSlotId !== slotId) {
      return;
    }

    // Cursor position in thumbnail controls the visible area of the zoomed background.
    setPan(toPanFromRatios(xRatio, yRatio));
  }, [hoveredSlotId]);

  const handleTouchStart = useCallback((touchY: number) => {
    touchStartYRef.current = touchY;
  }, []);

  const handleTouchMove = useCallback((touchY: number) => {
    if (!isMobile || expandedImageSrc) {
      return;
    }
    const startY = touchStartYRef.current;
    if (startY === null) {
      return;
    }

    const deltaY = startY - touchY;
    if (Math.abs(deltaY) < TOUCH_MIN_DELTA) {
      return;
    }

    // Reset baseline after each accepted swipe step for smooth carousel scrolling.
    touchStartYRef.current = touchY;
    pendingDirectionRef.current = deltaY > 0 ? 1 : -1;
    if (frameRef.current === null) {
      frameRef.current = window.requestAnimationFrame(flushPendingScroll);
    }
  }, [expandedImageSrc, flushPendingScroll, isMobile]);

  const immersiveImageSrc = isMobile ? expandedImageSrc : hoveredImageSrc;
  const visibleSlots = useMemo(() => scene.slots.slice(0, slotCount), [scene.slots, slotCount]);

  return (
    <main
      className={`home-page ${hoveredSlotId !== null || expandedImageSrc ? "is-hovering-image" : ""} ${isMobile ? "is-mobile" : ""}`}
      onWheel={handleWheel}
      onTouchStart={(event) => handleTouchStart(event.touches[0].clientY)}
      onTouchMove={(event) => {
        handleTouchMove(event.touches[0].clientY);
        if (isMobile && !expandedImageSrc) {
          event.preventDefault();
        }
      }}
      onTouchEnd={() => {
        touchStartYRef.current = null;
      }}
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

      {/* Hide the mobile thumbnail while the fullscreen view is open. */}
      {!(isMobile && expandedImageSrc) ? (
        <GalleryStage
          slots={visibleSlots}
          isMobile={isMobile}
          hoveredSlotId={hoveredSlotId}
          onImageClick={(slotId) => {
            if (!isMobile) {
              return;
            }
            const clickedSlot = visibleSlots.find((slot) => slot.id === slotId);
            if (!clickedSlot) {
              return;
            }
            setExpandedImageSrc(photos[clickedSlot.imageIndex].src.src);
          }}
          onHoverStart={(slotId, xRatio, yRatio) => {
            if (isMobile) {
              return;
            }
            setHoveredSlotId(slotId);
            setPan(toPanFromRatios(xRatio, yRatio));
          }}
          onHoverEnd={() => {
            if (isMobile) {
              return;
            }
            setHoveredSlotId(null);
          }}
          onHoverMove={handleHoverMove}
        />
      ) : null}

      {isMobile && expandedImageSrc ? (
        <button
          type="button"
          className="mobile-overlay-close"
          onClick={() => setExpandedImageSrc(null)}
          aria-label="Close image"
        />
      ) : null}
    </main>
  );
}
