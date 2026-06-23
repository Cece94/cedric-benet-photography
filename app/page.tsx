"use client";

import { useCallback, useMemo, useRef, useState, type WheelEvent } from "react";

import { GalleryStage, type StageSlot } from "@/components/GalleryStage";
import { ImmersiveHover } from "@/components/ImmersiveHover";
import { photos, slotLayouts } from "@/lib/gallery";

type SceneState = {
  slots: StageSlot[];
  nextImageIndex: number;
  stepCount: number;
};

const SLOT_COUNT = 5;
const THROTTLE_MS = 430;
const WHEEL_THRESHOLD = 36;

function toPanFromRatios(xRatio: number, yRatio: number) {
  const clampedX = Math.max(0, Math.min(1, xRatio));
  const clampedY = Math.max(0, Math.min(1, yRatio));

  return {
    x: 14 + clampedX * 72,
    y: 16 + clampedY * 68
  };
}

function getInitialState(): SceneState {
  const initialSlots: StageSlot[] = Array.from({ length: SLOT_COUNT }, (_, index) => ({
    id: index,
    imageIndex: index % photos.length,
    // Keep one dedicated lane per slot to prevent any overlap.
    layoutIndex: index % slotLayouts.length,
    version: 0
  }));

  return {
    slots: initialSlots,
    nextImageIndex: SLOT_COUNT % photos.length,
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
  const [scene, setScene] = useState<SceneState>(() => getInitialState());
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 50, y: 50 });

  const historyRef = useRef<SceneState[]>([]);
  const lastWheelAtRef = useRef(0);

  const advanceScene = useCallback((direction: 1 | -1) => {
    setScene((previous) => {
      if (direction === -1) {
        const restored = historyRef.current.pop();
        return restored ?? previous;
      }

      // Save one step before replacing the next slot.
      historyRef.current.push(cloneScene(previous));

      const targetSlotId = previous.stepCount % SLOT_COUNT;
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
  }, []);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      event.preventDefault();

      const absoluteDelta = Math.abs(event.deltaY);
      if (absoluteDelta < WHEEL_THRESHOLD) {
        return;
      }

      const now = Date.now();
      // Keep scroll transitions readable and avoid accidental multi-triggers.
      if (now - lastWheelAtRef.current < THROTTLE_MS) {
        return;
      }

      lastWheelAtRef.current = now;
      if (hoveredSlotId !== null) {
        setHoveredSlotId(null);
      }

      advanceScene(event.deltaY > 0 ? 1 : -1);
    },
    [advanceScene, hoveredSlotId]
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

  return (
    <main className="home-page" onWheel={handleWheel}>
      <ImmersiveHover imageSrc={hoveredImageSrc} panX={pan.x} panY={pan.y} />

      <header className="home-page__title">
        <p>Cedric Benet</p>
      </header>
      <div className="home-page__vertical-tag">Photography</div>

      <GalleryStage
        slots={scene.slots}
        hoveredSlotId={hoveredSlotId}
        onHoverStart={(slotId, xRatio, yRatio) => {
          setHoveredSlotId(slotId);
          setPan(toPanFromRatios(xRatio, yRatio));
        }}
        onHoverEnd={() => setHoveredSlotId(null)}
        onHoverMove={handleHoverMove}
      />
    </main>
  );
}
