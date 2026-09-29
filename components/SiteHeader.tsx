"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useLenis } from "@/components/SmoothScroll";

/** Fixed signature: white over the fullscreen hero, then the wall's ink colour. */
export function SiteHeader() {
  const [overHero, setOverHero] = useState(true);
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => {
      // The hero is one viewport tall; switch just before leaving it.
      setOverHero(window.scrollY < window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${overHero ? " site-header--light" : ""}`}>
      <p className="site-header__name">
        <Link
          href="/"
          className="site-header__home"
          onClick={e => {
            e.preventDefault();
            if (lenis) lenis.scrollTo(0, { duration: 2.4 });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Cédric Benet
        </Link>
      </p>
    </header>
  );
}
