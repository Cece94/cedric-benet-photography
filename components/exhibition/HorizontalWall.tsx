"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

import {
  Hiker,
  HomeIcon,
  Landmark,
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

/** Swing of the carried hiker per px/ms of drag speed (deg), and its limit. */
const HIKER_SWING = 28;
const HIKER_MAX_SWING = 40;
/** Length of the landing bounce once the hiker is let go (ms). */
const HIKER_LANDING = 520;

/** Prints fetched at once while warming the rest of the wall in the background. */
const WARM_PARALLEL = 2;

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
  // The hiker being carried by the pointer: last position, for the swing.
  const hikerDrag = useRef<{ x: number; t: number; settle?: ReturnType<typeof setTimeout> } | null>(null);
  // Item positions along the track, measured on mount and resize.
  const layout = useRef({ lefts: [] as number[], widths: [] as number[], lightsOut: Infinity });
  // Series shortcuts along the progress line: position (0–1) and scroll distance.
  const [markers, setMarkers] = useState<{ title: string; at: number; walk: number }[]>([]);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const landmarkRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lenis = useLenis();

  // How far the track overflows the viewport, i.e. how far the walk goes.
  const distance = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform([scrollYProgress, distance], ([p, d]: number[]) => -p * d);

  // Per-frame effects written straight to the DOM (no re-renders).
  const apply = (xv: number) => {
    const vw = window.innerWidth;
    // Read before any writes below, so this doesn't force a layout.
    const lineWidth = progressRef.current?.parentElement?.clientWidth ?? 0;
    const landmarkWidth = landmarkRefs.current.find(Boolean)?.offsetWidth ?? 0;
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

    // Each landmark fills with ink as the hiker walks across it.
    landmarkRefs.current.forEach((el, i) => {
      const m = markers[i];
      if (!el || !m || !landmarkWidth) return;
      const fill = clamp01(((progress - m.at) * lineWidth) / landmarkWidth + 0.5);
      el.style.setProperty("--fill", fill.toFixed(4));
    });
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

  // Pick the hiker up and carry them along the line: the wall follows.
  const carryTo = (clientX: number) => {
    const section = sectionRef.current;
    const line = progressRef.current?.parentElement;
    if (!section || !line) return;
    const rect = line.getBoundingClientRect();
    const top = section.offsetTop + clamp01((clientX - rect.left) / rect.width) * distance.get();
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  };

  const onHikerDown = (e: PointerEvent<HTMLSpanElement>) => {
    const hiker = e.currentTarget;
    e.preventDefault();
    hiker.setPointerCapture(e.pointerId);
    hiker.classList.remove("is-landing");
    hiker.classList.add("is-held");
    hikerDrag.current = { x: e.clientX, t: e.timeStamp };
    carryTo(e.clientX);
  };

  const onHikerMove = (e: PointerEvent<HTMLSpanElement>) => {
    const drag = hikerDrag.current;
    if (!drag) return;
    const hiker = e.currentTarget;
    // Dangling from the hand, the body trails behind the movement.
    const speed = (e.clientX - drag.x) / Math.max(1, e.timeStamp - drag.t);
    const swing = Math.max(-HIKER_MAX_SWING, Math.min(HIKER_MAX_SWING, -speed * HIKER_SWING));
    hiker.style.setProperty("--swing", `${swing.toFixed(1)}deg`);
    clearTimeout(drag.settle);
    drag.settle = setTimeout(() => hiker.style.setProperty("--swing", "0deg"), 90);
    drag.x = e.clientX;
    drag.t = e.timeStamp;
    carryTo(e.clientX);
  };

  const onHikerUp = (e: PointerEvent<HTMLSpanElement>) => {
    const drag = hikerDrag.current;
    if (!drag) return;
    const hiker = e.currentTarget;
    clearTimeout(drag.settle);
    hikerDrag.current = null;
    hiker.style.setProperty("--swing", "0deg");
    hiker.classList.remove("is-held");
    hiker.classList.add("is-landing");
    setTimeout(() => hiker.classList.remove("is-landing"), HIKER_LANDING);
  };

  // The wall slides by transform, so the browser's lazy loading only sees a
  // print when it is almost on screen: a fast walk or a jump to a chapter
  // then fetches and decodes a dozen large images mid-glide. Once the page
  // has settled, load the rest of the wall ahead of the visitor, in hanging
  // order and a couple at a time.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let stopped = false;
    const queue = [...track.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')];

    const worker = async () => {
      for (let img = queue.shift(); img && !stopped; img = queue.shift()) {
        img.loading = "eager";
        // Decoding here keeps it off the frames of the walk.
        await img.decode().catch(() => {});
      }
    };
    const start = () => {
      for (let i = 0; i < WARM_PARALLEL; i++) worker();
    };

    // Safari has no requestIdleCallback: a short delay does the same job.
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onLoad = () => {
      idle = setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(start) : start()), 500);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      stopped = true;
      clearTimeout(idle);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  /** Fetch a chapter's prints right away, ahead of the glide towards it. */
  const hurry = (title: string) => {
    const start = wall.findIndex(item => item.kind === "text" && item.title === title);
    const end = wall.findIndex((item, i) => i > start && item.kind === "text");
    itemRefs.current.slice(start, end < 0 ? wall.length : end).forEach(el =>
      el?.querySelectorAll("img").forEach(img => {
        img.fetchPriority = "high";
        img.loading = "eager";
      })
    );
  };

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
          <span
            ref={hikerRef}
            className="wall__hiker"
            onPointerDown={onHikerDown}
            onPointerMove={onHikerMove}
            onPointerUp={onHikerUp}
            onPointerCancel={onHikerUp}
          >
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
                hurry(m.title);
                const far = Math.abs(section.offsetTop + m.walk - window.scrollY);
                lenis.scrollTo(section.offsetTop + m.walk, { duration: Math.min(3, 1.4 + far / 10000) });
              }}
            >
              {m.title}
              <Landmark
                title={m.title}
                ref={el => {
                  landmarkRefs.current[i] = el;
                }}
              />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
