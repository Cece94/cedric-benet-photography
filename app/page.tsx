"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Hero } from "@/components/Hero";
import { Lightbox } from "@/components/Lightbox";
import { PhotoSection } from "@/components/PhotoSection";
import { SiteHeader } from "@/components/SiteHeader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { photos } from "@/lib/gallery";

const [heroPhoto, ...galleryPhotos] = photos;

export default function HomePage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <SmoothScroll>
      <SiteHeader />

      <Hero photo={heroPhoto} />

      <main className="gallery">
        {galleryPhotos.map((photo, i) => (
          <PhotoSection
            key={photo.id}
            photo={photo}
            index={i}
            total={galleryPhotos.length}
            // +1: the lightbox indexes the full photos array, hero included
            onOpen={i => setLightboxIndex(i + 1)}
          />
        ))}
      </main>

      <footer className="site-footer" id="contact">
        <motion.p
          className="site-footer__title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          Contact
        </motion.p>
        <a className="site-footer__mail" href="mailto:hello@cedricbenet.com">
          hello@cedricbenet.com
        </a>
        <p className="site-footer__copy">© {new Date().getFullYear()} Cédric Benet</p>
      </footer>

      <Lightbox
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </SmoothScroll>
  );
}
