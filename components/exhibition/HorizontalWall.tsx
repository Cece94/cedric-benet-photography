"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import {
  Hiker,
  HomeIcon,
  WallEnd,
  WallIntro,
  WallText,
  WorkFigure,
  clamp01,
  isPanorama,
  setLights,
  workNumbers
} from "./parts";
import { useLenis } from "@/components/SmoothScroll";
import { LIGHTS_OUT_ID, aspect, wall, type WorkSize } from "@/lib/gallery";

/** How long the hiker keeps walking after the wall stops moving (ms). */
const HIKER_STOP = 120;
/** Wall movement per frame (px) below which the hiker rests: ignores the smooth-scroll glide's long tail. */
const HIKER_MIN_STEP = 1.5;

/** Hanging height of each size, as a share of the viewport height. */
const HEIGHT: Record<WorkSize, number> = { s: 0.4, m: 0.54, l: 0.68 };

/**
 * Desktop exhibition: the section pins and vertical scrolling walks
 * sideways along a wall of hung photographs. Works unveil as they enter,
 * drift with a slight parallax inside their frames, and the wall slowly
 * goes dark as the night photographs of Iceland come into view.
 */
export function HorizontalWall({ onOpen, paused }: { onOpen: (index: number) => void; paused: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);
  // The hiker walking along the progress line, and when to let them rest.
  const hikerRef = useRef<HTMLSpanElement>(null);
  const hikerStep = useRef({ last: -1, timer: undefined as ReturnType<typeof setTimeout> | undefined });
  // Item positions along the track, measured on mount and resize.
  const layout = useRef({ lefts: [] as number[], widths: [] as number[], lightsOut: Infinity });
  // Series shortcuts along the progress line: position (0–1) and scroll distance.
  const [markers, setMarkers] = useState<{ title: string; at: number; walk: number }[]>([]);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lenis = useLenis();

  // How far the track overflows the viewport, i.e. how far the walk goes.
  const distance = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform([scrollYProgress, distance], ([p, d]: number[]) => -p * d);

  // Per-frame effects written straight to the DOM (no re-renders).
  const apply = (xv: number) => {
    const vw = window.innerWidth;
    const { lefts, widths, lightsOut } = layout.current;

    itemRefs.current.forEach((el, i) => {
      if (!el || lefts[i] === undefined) return;
      const screenLeft = lefts[i] + xv;
      if (screenLeft < vw * 0.9) el.classList.add("is-hung");

      const inner = innerRefs.current[i];
      if (inner) {
        const offset = (screenLeft + widths[i] / 2 - vw / 2) / vw;
        inner.style.transform = `translate3d(${(offset * -4).toFixed(3)}%, 0, 0)`;
      }
    });

    // Lights dim from the moment the dusk photo enters on the right,
    // reaching full night as it nears the left edge.
    setLights(clamp01((vw - (lightsOut + xv)) / (vw * 0.9)));

    const d = distance.get();
    const progress = d ? -xv / d : 0;
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;

    const hiker = hikerRef.current;
    const step = hikerStep.current;
    if (hiker) {
      hiker.style.left = `${progress * 100}%`;
      // Walk while the wall moves, turning round when heading back.
      if (step.last >= 0 && Math.abs(progress - step.last) * d > HIKER_MIN_STEP) {
        hiker.classList.add("is-walking");
        hiker.classList.toggle("is-back", progress < step.last);
        clearTimeout(step.timer);
        step.timer = setTimeout(() => hiker.classList.remove("is-walking"), HIKER_STOP);
      }
      step.last = progress;
    }

    // The series being walked through is the last one whose start is behind us.
    const current = markers.reduce((found, m, i) => (m.at <= progress + 0.002 ? i : found), -1);
    markerRefs.current.forEach((el, i) => el?.classList.toggle("is-active", i === current));
  };

  useMotionValueEvent(x, "change", apply);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const measure = () => {
      const lefts = itemRefs.current.map(el => el?.offsetLeft ?? 0);
      const widths = itemRefs.current.map(el => el?.offsetWidth ?? 0);
      const outIndex = wall.findIndex(item => item.kind === "work" && item.photo.id === LIGHTS_OUT_ID);
      layout.current = { lefts, widths, lightsOut: outIndex >= 0 ? lefts[outIndex] : Infinity };

      const overflow = Math.max(0, track.scrollWidth - window.innerWidth);
      distance.set(overflow);
      // Extra scroll height equal to the overflow gives a 1:1 walking speed.
      section.style.height = `calc(100svh + ${overflow}px)`;

      // One marker per series, where its wall text sits just inside the left edge.
      setMarkers(
        wall.flatMap((item, i) => {
          if (item.kind !== "text" || !overflow) return [];
          const walk = Math.min(overflow, Math.max(0, lefts[i] - window.innerWidth * 0.12));
          return [{ title: item.title, walk, at: walk / overflow }];
        })
      );
      apply(x.get());
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", measure);
    };
    // apply/x are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance]);

  // ← / → step from one work to the next, centring it on the wall.
  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const section = sectionRef.current;
      if (!section || !lenis) return;
      e.preventDefault();

      const { lefts, widths } = layout.current;
      const vw = window.innerWidth;
      const here = -x.get() + vw / 2;
      const centres = wall
        .map((item, i) => (item.kind === "work" ? lefts[i] + widths[i] / 2 : null))
        .filter((c): c is number => c !== null);
      const target =
        e.key === "ArrowRight"
          ? centres.find(c => c > here + 4)
          : [...centres].reverse().find(c => c < here - 4);
      if (target === undefined) return;

      const walk = Math.min(distance.get(), Math.max(0, target - vw / 2));
      lenis.scrollTo(section.offsetTop + walk, { duration: 1.8 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, lenis, x, distance]);

  return (
    <section ref={sectionRef} className="wall" aria-label="Exposition">
      <div className="wall__sticky">
        <motion.div ref={trackRef} className="wall__track" style={{ x }}>
          <WallIntro />

          {wall.map((item, i) => {
            const itemRef = (el: HTMLElement | null) => {
              itemRefs.current[i] = el;
            };

            if (item.kind === "text") return <WallText key={item.title} item={item} itemRef={itemRef} />;

            return (
              <WorkFigure
                key={item.photo.id}
                item={item}
                n={workNumbers[i]}
                onOpen={onOpen}
                sizes={`${Math.ceil(HEIGHT[item.size] * 110 * aspect(item.photo))}vh`}
                itemRef={itemRef}
                innerRef={el => {
                  innerRefs.current[i] = isPanorama(item) ? null : el;
                }}
              />
            );
          })}

          <WallEnd
            itemRef={el => {
              itemRefs.current[wall.length] = el;
            }}
          />
        </motion.div>

        <nav className="wall__progress" aria-label="Séries">
          <button
            type="button"
            className="wall__home"
            aria-label="Retour à l'accueil"
            onClick={() => (lenis ? lenis.scrollTo(0, { duration: 2.4 }) : window.scrollTo({ top: 0, behavior: "smooth" }))}
          >
            <HomeIcon />
          </button>
          <span ref={progressRef} className="wall__progress-fill" />
          <span ref={hikerRef} className="wall__hiker">
            <Hiker />
            <span className="wall__hiker-bubble">Hi !</span>
          </span>
          {markers.map((m, i) => (
            <button
              key={m.title}
              ref={el => {
                markerRefs.current[i] = el;
              }}
              className="wall__marker"
              style={{ left: `${m.at * 100}%` }}
              onClick={() => {
                const section = sectionRef.current;
                if (!section || !lenis) return;
                const far = Math.abs(section.offsetTop + m.walk - window.scrollY);
                lenis.scrollTo(section.offsetTop + m.walk, { duration: Math.min(3, 1.4 + far / 10000) });
              }}
            >
              {m.title}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
