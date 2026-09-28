"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

import type { Photo } from "@/lib/gallery";

/**
 * Fullscreen opening image: slow zoom-out on load, then the photo
 * gently recedes and dims as the user starts scrolling.
 */
export function Hero({ photo }: { photo: Photo }) {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);

  return (
    <section ref={ref} className="hero">
      <motion.div className="hero__media" style={{ scale, opacity }}>
        <motion.div
          className="hero__zoom"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            placeholder="blur"
            priority
            quality={100}
            fill
            // Portrait screens crop-and-zoom this landscape photo to cover
            // the full height, so a much wider source is needed than 100vw.
            sizes="(orientation: portrait) 250vw, 100vw"
            className="hero__img"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="hero__hint"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        <span className="hero__hint-label">Scroll</span>
        <span className="hero__hint-line" />
      </motion.div>
    </section>
  );
}
