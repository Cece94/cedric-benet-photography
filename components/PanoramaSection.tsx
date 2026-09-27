"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";

import type { PhotoItem } from "@/lib/gallery";

type Props = {
  photo: PhotoItem;
  index: number;
  total: number;
  onOpen: (index: number) => void;
};

/**
 * Ultra-wide photo shown at full viewport height: the section pins while
 * vertical scrolling pans the image sideways, one pixel for one pixel.
 */
export function PanoramaSection({ photo, index, total, onOpen }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // How far the image overflows the viewport, i.e. how far it must travel.
  const distance = useMotionValue(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const measure = () => {
      const overflow = Math.max(0, track.scrollWidth - window.innerWidth);
      distance.set(overflow);
      // Extra scroll height equal to the overflow gives a 1:1 pan speed.
      section.style.height = `calc(100svh + ${overflow}px)`;
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [distance]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });
  const x = useTransform([scrollYProgress, distance], ([p, d]: number[]) => -p * d);

  const counter = `${String(index + 1).padStart(2, "0")} — ${String(total).padStart(2, "0")}`;

  return (
    <section ref={sectionRef} className="panorama">
      <div className="panorama__sticky">
        <motion.div ref={trackRef} className="panorama__track" style={{ x }}>
          <Image
            src={photo.src}
            alt={photo.alt}
            placeholder="blur"
            // Wider than next/image's largest variant (3840px): serve the
            // pre-optimized file as-is so the full resolution is kept.
            unoptimized
            className="panorama__img"
            onClick={() => onOpen(index)}
          />
        </motion.div>

        <div className="panorama__caption">
          <span className="photo-section__title">{photo.title}</span>
          <span className="photo-section__counter">{counter}</span>
        </div>
      </div>
    </section>
  );
}
