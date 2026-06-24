"use client";

import Image from "next/image";

import { photos } from "@/lib/gallery";

export type StageSlot = {
  id: number;
  imageIndex: number;
};

type GalleryStageProps = {
  slots: StageSlot[];
  isMobile: boolean;
  desktopProgress: number;
  hoveredSlotId: number | null;
  onImageClick: (slotId: number) => void;
  onHoverStart: (slotId: number, xRatio: number, yRatio: number) => void;
  onHoverEnd: () => void;
  onHoverMove: (slotId: number, xRatio: number, yRatio: number) => void;
};

export function GalleryStage({
  slots,
  isMobile,
  desktopProgress,
  hoveredSlotId,
  onImageClick,
  onHoverStart,
  onHoverEnd,
  onHoverMove
}: GalleryStageProps) {
  const isHovering = hoveredSlotId !== null;
  const verticalOffsets = [-110, -55, 0, 52, 104] as const;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  return (
    <div className={`gallery-stage ${isHovering ? "is-hovering" : ""} ${isMobile ? "is-mobile" : ""}`}>
      {slots.map((slot, index) => {
        const photo = photos[slot.imageIndex];
        const isHovered = hoveredSlotId === slot.id;
        const normalizedOffset = slot.id - desktopProgress;
        const absOffset = Math.abs(normalizedOffset);
        const laneOffsetY = verticalOffsets[slot.imageIndex % verticalOffsets.length];
        const leftPercent = 50 + normalizedOffset * 26;
        // Angle side cards toward center for a stronger 3D gallery feel.
        const centerYaw = clamp(-normalizedOffset * 14, -26, 26);
        // Light banking: right side leans right, center straightens, left leans left.
        const driftTilt = clamp(normalizedOffset * 4.2, -4.5, 4.5);
        const opacity = Math.max(0, 1 - Math.max(0, absOffset - 1.9) * 1.25);
        const zIndex = Math.round(100 - absOffset * 10);

        return (
          <div
            key={`slot-shell-${slot.id}`}
            className={`slot-shell ${isHovered ? "is-hovered" : ""}`}
            style={
              isMobile
                ? undefined
                : {
                    left: `${leftPercent}%`,
                    top: `calc(50% + ${laneOffsetY}px)`,
                    width: "min(36vw, 680px)",
                    transform: `translate(-50%, -50%) perspective(1400px) rotateY(${centerYaw}deg) rotate(${driftTilt}deg)`,
                    opacity,
                    zIndex,
                    pointerEvents: absOffset < 0.7 ? "auto" : "none"
                  }
            }
          >
            <div className="photo-card">
              <button
                className="photo-slot"
                type="button"
                onClick={() => onImageClick(slot.id)}
                onMouseEnter={(event) => {
                  if (isMobile) {
                    return;
                  }
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const xRatio = (event.clientX - bounds.left) / bounds.width;
                  const yRatio = (event.clientY - bounds.top) / bounds.height;
                  onHoverStart(slot.id, xRatio, yRatio);
                }}
                onMouseLeave={() => {
                  if (isMobile) {
                    return;
                  }
                  onHoverEnd();
                }}
                onMouseMove={(event) => {
                  if (isMobile) {
                    return;
                  }
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
                  sizes="(max-width: 900px) 88vw, 18vw"
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
