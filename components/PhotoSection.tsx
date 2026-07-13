"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

import type { PhotoItem } from "@/lib/gallery";

type Props = {
  photo: PhotoItem;
  index: number;
  total: number;
  onOpen: (index: number) => void;
};

/**
 * One editorial gallery section: the image reveals itself on scroll
 * (clip + scale) and drifts with a subtle parallax while in view.
 */
export function PhotoSection({ photo, index, total, onOpen }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Parallax: the image travels slower than the page while crossing the viewport.
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const counter = `${String(index + 1).padStart(2, "0")} — ${String(total).padStart(2, "0")}`;

  return (
    <section ref={sectionRef} className={`photo-section photo-section--${photo.layout}`}>
      <motion.figure
        className="photo-section__figure"
        initial={{ clipPath: "inset(12% 6% 12% 6%)", scale: 1.08, opacity: 0.6 }}
        whileInView={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => onOpen(index)}
      >
        <motion.div className="photo-section__parallax" style={{ y }}>
          <Image
            src={photo.src}
            alt={photo.alt}
            placeholder="blur"
            quality={90}
            sizes="(max-width: 900px) 100vw, 90vw"
            className="photo-section__img"
          />
        </motion.div>
      </motion.figure>

      <motion.div
        className="photo-section__caption"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.9 }}
        transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
      >
        <span className="photo-section__title">{photo.title}</span>
        <span className="photo-section__counter">{counter}</span>
      </motion.div>
    </section>
  );
}
