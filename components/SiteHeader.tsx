"use client";

import { useEffect, useState } from "react";

/** Fixed header: white over the fullscreen hero, ink once on the light background. */
export function SiteHeader() {
  const [overHero, setOverHero] = useState(true);

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
      <p className="site-header__name">Cédric Benet</p>
      <nav className="site-header__nav" aria-label="Main menu">
        <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}
