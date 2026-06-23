"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { photos, slotLayouts } from "@/lib/gallery";

export type StageSlot = {
  id: number;
  imageIndex: number;
  layoutIndex: number;
  version: number;
};

type GalleryStageProps = {
  slots: StageSlot[];
  hoveredSlotId: number | null;
  onHoverStart: (slotId: number) => void;
  onHoverEnd: () => void;
  onHoverMove: (slotId: number, xRatio: number, yRatio: number) => void;
};

export function GalleryStage({
  slots,
  hoveredSlotId,
  onHoverStart,
  onHoverEnd,
  onHoverMove
}: GalleryStageProps) {
  const isHovering = hoveredSlotId !== null;

  return (
    <div className={`gallery-stage ${isHovering ? "is-hovering" : ""}`}>
      {slots.map((slot) => {
        const photo = photos[slot.imageIndex];
        const layout = slotLayouts[slot.layoutIndex];
        const isHovered = hoveredSlotId === slot.id;

        return (
          <div
            key={`slot-shell-${slot.id}`}
            className={`slot-shell ${isHovered ? "is-hovered" : ""}`}
            style={{ left: layout.left, top: layout.top, width: layout.width }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`slot-${slot.id}-version-${slot.version}`}
                className="photo-card"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <button
                  className="photo-slot"
                  type="button"
                  onMouseEnter={() => onHoverStart(slot.id)}
                  onMouseLeave={onHoverEnd}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const xRatio = (event.clientX - bounds.left) / bounds.width;
                    const yRatio = (event.clientY - bounds.top) / bounds.height;
                    onHoverMove(slot.id, xRatio, yRatio);
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    className="photo-slot__image"
                    placeholder="blur"
                    sizes="(max-width: 768px) 45vw, 22vw"
                  />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
