"use client";

import Image from "next/image";

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
  onHoverStart: (slotId: number, xRatio: number, yRatio: number) => void;
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
      {slots.map((slot, index) => {
        const photo = photos[slot.imageIndex];
        const layout = slotLayouts[slot.layoutIndex];
        const isHovered = hoveredSlotId === slot.id;

        return (
          <div
            key={`slot-shell-${slot.id}`}
            className={`slot-shell ${isHovered ? "is-hovered" : ""}`}
            style={{ left: layout.left, top: layout.top, width: layout.width }}
          >
            <div className="photo-card">
              <button
                className="photo-slot"
                type="button"
                onMouseEnter={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const xRatio = (event.clientX - bounds.left) / bounds.width;
                  const yRatio = (event.clientY - bounds.top) / bounds.height;
                  onHoverStart(slot.id, xRatio, yRatio);
                }}
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
                  quality={45}
                  priority={index < 3}
                  loading={index < 3 ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 40vw, 20vw"
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
