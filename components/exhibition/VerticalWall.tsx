"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";

import { WallEnd, WallIntro, WallText, WorkFigure, clamp01, isPanorama, setLights, workNumbers } from "./parts";
import { LIGHTS_OUT_ID, aspect, wall, type WallItem } from "@/lib/gallery";

type Work = Extract<WallItem, { kind: "work" }>;
type Hang = { width: number; align: "full" | "left" | "right" };

/**
 * How each work hangs on the phone wall: large landscapes bleed edge to
 * edge; everything else takes part of the width, alternating sides so the
 * eye zig-zags down the page like along a staircase gallery.
 */
const hangs: (Hang | null)[] = (() => {
  let side = 0;
  return wall.map(item => {
    if (item.kind !== "work" || isPanorama(item)) return null;
    const ar = aspect(item.photo);
    if (ar >= 1.2 && item.size !== "s") return { width: 100, align: "full" };

    const width =
      ar >= 1.2 ? 80 : ar >= 0.85 ? (item.size === "s" ? 68 : 84) : { s: 62, m: 74, l: 84 }[item.size];
    return { width, align: side++ % 2 ? "right" : "left" };
  });
})();

/** The panorama pins full-height and pans sideways as the page scrolls. */
function PinnedPanorama({
  item,
  n,
  onOpen,
  itemRef
}: {
  item: Work;
  n: number;
  onOpen: (index: number) => void;
  itemRef: (el: HTMLElement | null) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const distance = useMotionValue(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const measure = () => {
      const overflow = Math.max(0, track.scrollWidth - window.innerWidth);
      distance.set(overflow);
      section.style.height = `calc(100svh + ${overflow}px)`;
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    return () => resize.disconnect();
  }, [distance]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform([scrollYProgress, distance], ([p, d]: number[]) => -p * d);

  return (
    <section ref={sectionRef} className="vpano">
      <div className="vpano__sticky">
        <motion.div ref={trackRef} className="vpano__track" style={{ x }}>
          <WorkFigure item={item} n={n} onOpen={onOpen} sizes="100vw" itemRef={itemRef} />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Phone exhibition: the same wall turned vertical. Works hang one below
 * the other and unveil downwards as they arrive; the lights still go out
 * at dusk.
 */
export function VerticalWall({ onOpen }: { onOpen: (index: number) => void }) {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const outIndex = wall.findIndex(item => item.kind === "work" && item.photo.id === LIGHTS_OUT_ID);
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.88) el.classList.add("is-hung");

        const inner = innerRefs.current[i];
        if (inner && rect.bottom > 0 && rect.top < vh) {
          const offset = (rect.top + rect.height / 2 - vh / 2) / vh;
          inner.style.transform = `translate3d(0, ${(offset * -5).toFixed(3)}%, 0)`;
        }
      });

      const dusk = itemRefs.current[outIndex]?.getBoundingClientRect().top ?? Infinity;
      setLights(clamp01((vh * 0.95 - dusk) / (vh * 0.8)));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section className="vwall" aria-label="Exposition">
      <WallIntro />

      {wall.map((item, i) => {
        const itemRef = (el: HTMLElement | null) => {
          itemRefs.current[i] = el;
        };

        if (item.kind === "text") return <WallText key={item.title} item={item} itemRef={itemRef} />;

        if (isPanorama(item)) {
          return (
            <PinnedPanorama key={item.photo.id} item={item} n={workNumbers[i]} onOpen={onOpen} itemRef={itemRef} />
          );
        }

        const hang = hangs[i]!;
        return (
          <div
            key={item.photo.id}
            className={`vwall__hang vwall__hang--${hang.align}`}
            style={{ "--w": hang.width } as CSSProperties}
          >
            <WorkFigure
              item={item}
              n={workNumbers[i]}
              onOpen={onOpen}
              sizes={`${hang.width}vw`}
              itemRef={itemRef}
              innerRef={el => {
                innerRefs.current[i] = el;
              }}
            />
          </div>
        );
      })}

      <WallEnd
        itemRef={el => {
          itemRefs.current[wall.length] = el;
        }}
      />
    </section>
  );
}
