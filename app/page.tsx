"use client";

import { useState } from "react";

import { ExhibitionWall } from "@/components/ExhibitionWall";
import { Hero } from "@/components/Hero";
import { Lightbox } from "@/components/Lightbox";
import { SiteHeader } from "@/components/SiteHeader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { hero } from "@/lib/gallery";

export default function HomePage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <SmoothScroll>
      <SiteHeader />

      <Hero photo={hero} />

      <main>
        <ExhibitionWall onOpen={setLightboxIndex} paused={lightboxIndex !== null} />
      </main>

      <Lightbox
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </SmoothScroll>
  );
}
