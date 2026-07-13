"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { photos } from "@/lib/gallery";

type Props = {
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/** Fullscreen viewer: fade-in backdrop, arrow-key navigation, Escape to close. */
export function Lightbox({ index, onClose, onNavigate }: Props) {
  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return;
      onNavigate((index + dir + photos.length) % photos.length);
    },
    [index, onNavigate]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, step]);

  const photo = index !== null ? photos[index] : null;

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          onClick={onClose}
        >
          {/* key remounts the image so each navigation gets its own scale-in */}
          <motion.div
            key={photo.id}
            className="lightbox__frame"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              placeholder="blur"
              quality={95}
              sizes="100vw"
              className="lightbox__img"
            />
          </motion.div>

          <p className="lightbox__caption">
            {photo.title} — {photo.year}
          </p>

          <button className="lightbox__close" onClick={onClose} aria-label="Fermer" />
          <button
            className="lightbox__nav lightbox__nav--prev"
            onClick={e => { e.stopPropagation(); step(-1); }}
            aria-label="Précédent"
          >
            ←
          </button>
          <button
            className="lightbox__nav lightbox__nav--next"
            onClick={e => { e.stopPropagation(); step(1); }}
            aria-label="Suivant"
          >
            →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
