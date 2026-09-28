"use client";

import { useSyncExternalStore } from "react";

import { HorizontalWall } from "@/components/exhibition/HorizontalWall";
import { VerticalWall } from "@/components/exhibition/VerticalWall";

// Phones (and portrait tablets) get the vertical wall: a sideways walk
// leaves too little height for the photographs on a narrow screen.
const VERTICAL_QUERY = "(max-width: 700px), (orientation: portrait) and (max-width: 1024px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(VERTICAL_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** The gallery as an exhibition, laid out for the visitor's screen. */
export function ExhibitionWall({ onOpen, paused }: { onOpen: (index: number) => void; paused: boolean }) {
  const vertical = useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(VERTICAL_QUERY).matches,
    () => null
  );

  // Unknown on the server: hold the space until the client decides.
  if (vertical === null) return <div className="wall" />;

  return vertical ? <VerticalWall onOpen={onOpen} /> : <HorizontalWall onOpen={onOpen} paused={paused} />;
}
