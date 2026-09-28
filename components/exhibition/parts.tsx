"use client";

import type { CSSProperties, Ref } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { about } from "@/lib/about";
import { aspect, portrait, wall, type WallItem } from "@/lib/gallery";

type Work = Extract<WallItem, { kind: "work" }>;
type Text = Extract<WallItem, { kind: "text" }>;

/** Cartel number of each wall item (-1 for wall texts). */
export const workNumbers = (() => {
  let n = 0;
  return wall.map(item => (item.kind === "work" ? n++ : -1));
})();

export const isPanorama = (item: Work) => aspect(item.photo) > 3;

// Wall and text colours, from gallery light to night.
const PAPER = [253, 253, 251];
const NIGHT = [13, 13, 12];
const INK = [17, 17, 17];
const MOON = [232, 230, 224];

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 = gallery lights on, 1 = night. Eased, written to CSS variables. */
export function setLights(t: number) {
  const dark = t * t * (3 - 2 * t);
  const ink = mix(INK, MOON, dark);
  const root = document.documentElement.style;
  root.setProperty("--wall", `rgb(${mix(PAPER, NIGHT, dark).join(",")})`);
  root.setProperty("--wall-ink", `rgb(${ink.join(",")})`);
  root.setProperty("--wall-muted", `rgba(${ink.join(",")}, 0.5)`);
}

/** Opening of the show: the photographer's portrait and a few words about them. */
export function WallIntro() {
  return (
    <div className="wall__about">
      {/* The figure is observed, not the frame: a fully clipped frame never
          counts as visible, so it would never unveil itself. */}
      <motion.figure
        className="intro-portrait"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.4 }}
      >
        <motion.div
          className="intro-portrait__frame"
          variants={{ hidden: { clipPath: "inset(0 100% 0 0)" }, shown: { clipPath: "inset(0 0% 0 0)" } }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={portrait.src}
            alt={portrait.alt}
            fill
            placeholder="blur"
            quality={100}
            sizes="(max-width: 700px) 100vw, 99vh"
            className="intro-portrait__img"
          />
        </motion.div>
        <figcaption className="work__label">
          <span className="work__title">{portrait.title}</span>
          <span className="work__year">{portrait.year}</span>
        </figcaption>
      </motion.figure>

      <div className="wall__bio">
        <p className="wall__eyebrow">{about.eyebrow}</p>
        {about.paragraphs.map(text => (
          <p key={text} className="wall__bio-text">
            {text}
          </p>
        ))}
        <p className="wall__hint" aria-hidden="true">
          <span>Faites défiler</span>
          <span className="wall__hint-line" />
        </p>
      </div>
    </div>
  );
}

export function WallText({ item, itemRef }: { item: Text; itemRef: Ref<HTMLDivElement> }) {
  return (
    <div ref={itemRef} className="wall-text">
      <h3 className="wall-text__title">{item.title}</h3>
      <p className="wall-text__meta">{item.meta}</p>
    </div>
  );
}

type WorkProps = {
  item: Work;
  n: number;
  onOpen: (index: number) => void;
  sizes: string;
  className?: string;
  itemRef?: Ref<HTMLElement>;
  innerRef?: Ref<HTMLDivElement>;
};

/** A hung print: framed image that unveils on arrival, plus its museum cartel. */
export function WorkFigure({ item, n, onOpen, sizes, className = "", itemRef, innerRef }: WorkProps) {
  const { photo, size, tight } = item;
  const panorama = isPanorama(item);

  return (
    <figure
      ref={itemRef}
      className={`work work--${size}${tight ? " work--tight" : ""}${panorama ? " work--panorama" : ""} ${className}`}
      style={{ "--ar": aspect(photo) } as CSSProperties}
    >
      <div className="work__box">
        <button className="work__frame" onClick={() => onOpen(n)} aria-label={`Agrandir « ${photo.title} »`}>
          <div ref={innerRef} className="work__inner">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              placeholder="blur"
              quality={100}
              // Wider than next/image's largest variant: serve the
              // pre-optimized file as-is to keep full resolution.
              unoptimized={panorama}
              sizes={sizes}
              className="work__img"
            />
          </div>
        </button>
      </div>
      <figcaption className="work__label">
        <span className="work__num">{String(n + 1).padStart(2, "0")}</span>
        <span className="work__title">{photo.title}</span>
        <span className="work__year">{photo.year}</span>
      </figcaption>
    </figure>
  );
}

export function WallEnd({ itemRef }: { itemRef: Ref<HTMLDivElement> }) {
  return (
    <div ref={itemRef} className="wall-end" id="contact">
      <p className="wall-text__title">Merci</p>
      <a className="wall-end__mail" href="mailto:hello@cedricbenet.com">
        hello@cedricbenet.com
      </a>
      <p className="wall-end__links">
        <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
          Instagram
        </a>
        <span>© {new Date().getFullYear()} Cédric Benet</span>
      </p>
    </div>
  );
}

/** Little house at the start of the walk: the way back home. */
export function HomeIcon() {
  return (
    <svg viewBox="2.5 3 19 17.5" aria-hidden="true">
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10.2 19.5v-5h3.6v5" />
    </svg>
  );
}

/**
 * A hiker with a backpack and a trekking pole, feet on the bottom edge.
 * The raised arm only shows when they wave hello (on hover).
 */
export function Hiker() {
  return (
    <svg viewBox="0 0 24 30" aria-hidden="true">
      <g className="hiker__body">
        <path className="hiker__leg hiker__leg--back" d="M11.5 19 11 28.5l2 .3" />
        <rect className="hiker__pack" x="5.2" y="9.2" width="5.6" height="9.6" rx="1.8" />
        <path d="M12.5 10 11.5 19" />
        <circle className="hiker__head" cx="13.6" cy="5.6" r="2.6" />
        <path className="hiker__leg hiker__leg--front" d="M11.5 19 11 28.5l2 .3" />
        {/* raised well clear of the head so the waving hand shows */}
        <g className="hiker__wave">
          <path d="M12.6 10.6 17.4 8.6" />
          <g className="hiker__forearm">
            <path d="M17.4 8.6 19 2.4" />
            <circle className="hiker__hand" cx="19.1" cy="2" r="0.9" />
          </g>
        </g>
        <g className="hiker__arm">
          <path d="M12.4 11 14.4 16.2" />
          <path className="hiker__pole" d="M14.6 13.6 16.4 29.5" />
        </g>
      </g>
    </svg>
  );
}
