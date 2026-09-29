"use client";

import type { CSSProperties, ReactNode, Ref } from "react";
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
      </figcaption>
    </figure>
  );
}

export function WallEnd({ itemRef }: { itemRef: Ref<HTMLDivElement> }) {
  return (
    <div ref={itemRef} className="wall-end" id="contact">
      <p className="wall-text__title">Merci</p>
      <a className="wall-end__mail" href="mailto:cedricbenetphoto@gmail.com">
        cedricbenetphoto@gmail.com
      </a>
      <p className="wall-end__cv">
        <span className="wall-end__cv-label">Exposition</span>
        2023 — ImageNation Paris, Paris Photo OFF, Galerie Joseph Le Palais
      </p>
      <p className="wall-end__links">
        <a href="https://www.instagram.com/cedricbenet.photo/" target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href="/Cedric_Benet_Dossier_artistique.pdf" target="_blank" rel="noreferrer">
          Dossier artistique
        </a>
        <span>© {new Date().getFullYear()} Cédric Benet</span>
      </p>
    </div>
  );
}

/** Little mountain hut at the start of the walk: the way back home. Smoke rises on hover. */
export function HomeIcon() {
  return (
    <svg viewBox="1 3.2 22 17.6" aria-hidden="true">
      <path className="home__smoke" d="M17.5 2.6c-.8-.6.3-1.2-.3-1.9" />
      <path className="home__smoke home__smoke--late" d="M17.5 2.6c-.8-.6.3-1.2-.3-1.9" />
      <path d="M16.4 7.3V4h2.2v5.1" />
      <path d="M2 12.2 12 4l10 8.2" />
      <path d="M4.6 10.3V20h14.8v-9.7" />
      <path d="M10.2 20v-3.9a1.8 1.8 0 0 1 3.6 0V20" />
      <circle cx="12" cy="10.6" r="1.2" />
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

/**
 * A sun: a disc with short rays. A setting sun is half sunk below the
 * horizon, so only its upper rays show.
 */
function Sun({ cx, cy, r, setting = false }: { cx: number; cy: number; r: number; setting?: boolean }) {
  const angles = setting ? [205, 238, 270, 302, 335] : [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      {setting ? (
        <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`} />
      ) : (
        <circle cx={cx} cy={cy} r={r} />
      )}
      <g stroke="currentColor" strokeWidth={0.55} strokeLinecap="round">
        {angles.map(a => {
          const rad = (a * Math.PI) / 180;
          const [cos, sin] = [Math.cos(rad), Math.sin(rad)];
          return (
            <line
              key={a}
              x1={(cx + cos * r * 1.45).toFixed(2)}
              y1={(cy + sin * r * 1.45).toFixed(2)}
              x2={(cx + cos * r * 2).toFixed(2)}
              y2={(cy + sin * r * 2).toFixed(2)}
            />
          );
        })}
      </g>
    </g>
  );
}

/**
 * The aurora as a curtain of dots: columns along a gentle wave, brightest
 * at the bottom hem and fading upwards. [x, y, radius, opacity]
 */
const AURORA = Array.from({ length: 30 }, (_, i) => 6 + i * 2.35).flatMap(x => {
  const hem = 8.6 + 2.4 * Math.sin(x / 8.5);
  return [
    [x, hem, 0.42, 0.85],
    [x + 0.3, hem - 1.5, 0.36, 0.55],
    [x + 0.6, hem - 3, 0.3, 0.3],
    [x + 0.9, hem - 4.5, 0.25, 0.15]
  ].map(([cx, cy, r, o]) => [+cx.toFixed(2), +cy.toFixed(2), r, o] as const);
});

/** A four-pointed twinkling star of half-size `s`. */
function Star({ x, y, s }: { x: number; y: number; s: number }) {
  const k = s * 0.28;
  return (
    <path
      d={`M${x} ${y - s}L${x + k} ${y - k} ${x + s} ${y}L${x + k} ${y + k} ${x} ${y + s}L${x - k} ${y + k} ${x - s} ${y}L${x - k} ${y - k}Z`}
    />
  );
}

/**
 * Skyline of each chapter of the day, rising out of the progress line and
 * falling back into it (base on y = 24), the sun rising then setting
 * from one to the next. Keyed by the chapter's wall-text title.
 */
const LANDMARKS: Record<string, ReactNode> = {
  // Lofoten at dawn: snow-streaked walls plunging into a fjord, a rorbu, a sea eagle
  Aube: (
    <>
      <Sun cx={4} cy={16.4} r={1.6} />
      <path fillOpacity="0.15" d="M14.6 6.06 15.4 4.08 15.3 9.6ZM21 7.5 21.8 9.5 21.2 13.2ZM48.4 6.44 49.2 4.68 49 10.2ZM54.4 6.48 55.2 8.18 54.6 12.4Z" />
      <path fillRule="evenodd" d="M0 24 4 23.2 7.5 19 10.5 9 12.6 11 16 2.6 18.6 7.8 20.4 6 23.4 13.5 25.6 20.5 27.4 24H31.6V21.4L33.8 19.6 36 21.4V24H40.6L42.4 19.5 44.6 8.4 46.6 10.4 49.6 3.8 51.6 7 53.8 5.2 57 12 61 18.4 67 22 74 23.4 80 24ZM14.6 6.06 15.4 4.08 15.3 9.6ZM21 7.5 21.8 9.5 21.2 13.2ZM48.4 6.44 49.2 4.68 49 10.2ZM54.4 6.48 55.2 8.18 54.6 12.4Z" />
      <path d="M58 6.2 61 4.8 63.2 5 64.3 5.8 65 5.2 65.7 5.8 66.8 5 69 4.8 72 6.2 69.4 6.1 67 6.6 65.8 7.3 65.6 8.6 65 9.1 64.4 8.6 64.2 7.3 63 6.6 60.6 6.1Z" />
    </>
  ),
  // The highlands by day: a snow-streaked massif rising from black sand
  Journée: (
    <>
      <Sun cx={66} cy={5} r={2} />
      <path fillOpacity="0.15" d="M28.6 8.9 30.4 6.4 32.6 9.2 35.4 3.8 38.4 8.6 37.2 9.4 36 8.4 35 10.6 33.8 9.8 32.2 11.2 31.2 9.6 29.6 10.6ZM41.6 10.2 42.8 10.6 41.9 14.8ZM48.6 10.4 50 9.6 51.6 10.8 50.6 11.2 50.2 14.6 49.6 11.2Z" />
      <path fillOpacity="0.5" fillRule="evenodd" d="M18 22.4C21.6 20 24.4 15.4 27 11.2L30.4 6.4 32.6 9.2 35.4 3.8 38.4 8.6C41 9.8 43.6 11.4 46.4 11.6L50 9.6 52.8 11.8C56.6 13.6 60.6 17.4 64 19.6 66.6 21.4 69 22 72 22.4ZM28.6 8.9 30.4 6.4 32.6 9.2 35.4 3.8 38.4 8.6 37.2 9.4 36 8.4 35 10.6 33.8 9.8 32.2 11.2 31.2 9.6 29.6 10.6ZM41.6 10.2 42.8 10.6 41.9 14.8ZM48.6 10.4 50 9.6 51.6 10.8 50.6 11.2 50.2 14.6 49.6 11.2Z" />
      <path d="M0 24C4 23.4 8 22.3 14 22.2 20 22 22 21.6 28 21.8 34 22 38 21.5 44 21.7 50 21.9 56 21.4 62 21.7 68 21.9 74 22.8 80 24Z" />
    </>
  ),
  // Dusk: a smoking volcano, the sun about to touch the horizon
  Crépuscule: (
    <>
      <Sun cx={67} cy={23.4} r={2.6} setting />
      <path d="M0 24C12 23.6 20 20.6 27 14.4L31.6 10H34.8L36.4 11.4 38 10H41.6L46.4 14.4C53 20.6 62 23.6 80 24Z" />
      <circle cx="36.4" cy="7.6" r="1.8" />
      <circle cx="38.6" cy="4.8" r="2.2" />
      <circle cx="42.2" cy="2.6" r="2.3" />
    </>
  ),
  // Night: a cabin with a lit window under the aurora, a crescent moon and stars
  Nuit: (
    <>
      {AURORA.map(([x, y, r, opacity]) => (
        <circle key={`${x} ${y}`} cx={x} cy={y} r={r} fillOpacity={opacity} />
      ))}
      <path
        fillRule="evenodd"
        d="M0 24C8 23.4 14 20 22 19.4 28 19 32 20.6 38 20.4L44 20.2V15.6L49 12 54 15.6V20C60 19.6 66 18.6 72 21 76 22.6 78 23.6 80 24ZM46.8 18.6H48.6V16.8H46.8Z"
      />
      <path d="M56 19.9 58 14 60 19.6Z" />
      <path d="M4.21 1.12A2.3 2.3 0 1 0 4.21 5.28 2.59 2.59 0 0 1 4.21 1.12Z" />
      <Star x={14} y={2.4} s={1.2} />
      <Star x={39} y={14.8} s={0.9} />
      <Star x={71} y={15.4} s={1.1} />
      <Star x={25} y={15} s={0.8} />
    </>
  ),
};

/**
 * A chapter's skyline: a pale base, and an ink copy revealed left to right
 * as the hiker walks across it (driven by the --fill variable, 0–1).
 */
export function Landmark({ title, ref }: { title: string; ref?: Ref<HTMLSpanElement> }) {
  const art = LANDMARKS[title];
  if (!art) return null;
  return (
    <span ref={ref} className="wall__landmark" aria-hidden="true">
      <svg className="wall__landmark-base" viewBox="0 0 80 24">
        {art}
      </svg>
      <svg className="wall__landmark-ink" viewBox="0 0 80 24">
        {art}
      </svg>
    </span>
  );
}
