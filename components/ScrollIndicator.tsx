"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

const MIN_THUMB = 40;
const HIDE_DELAY = 900;

/**
 * macOS-style overlay scrollbar: a thin thumb that fades in while the page
 * scrolls (or is hovered/dragged) and fades out at rest. The native
 * scrollbar is hidden in globals.css, so every platform looks the same.
 */
export function ScrollIndicator() {
  const [thumb, setThumb] = useState({ top: 0, height: 0 });
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hovering = useRef(false);
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const view = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= view) {
        setThumb({ top: 0, height: 0 });
        return;
      }
      const height = Math.max(MIN_THUMB, (view / total) * view);
      const top = (window.scrollY / (total - view)) * (view - height);
      setThumb({ top, height });
    };

    const onScroll = () => {
      measure();
      setVisible(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        if (!hovering.current && !drag.current) setVisible(false);
      }, HIDE_DELAY);
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startScroll: window.scrollY };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const view = window.innerHeight;
    const total = document.documentElement.scrollHeight;
    const ratio = (total - view) / (view - thumb.height);
    window.scrollTo(0, drag.current.startScroll + (e.clientY - drag.current.startY) * ratio);
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  if (thumb.height === 0) return null;

  return (
    <div
      className={`scroll-indicator${visible ? " scroll-indicator--visible" : ""}`}
      aria-hidden="true"
      onPointerEnter={() => {
        hovering.current = true;
        setVisible(true);
      }}
      onPointerLeave={() => {
        hovering.current = false;
        if (!drag.current) setVisible(false);
      }}
    >
      <div
        className="scroll-indicator__thumb"
        style={{ transform: `translateY(${thumb.top}px)`, height: thumb.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
