"use client";

import { useEffect, useRef, useState, type WheelEvent } from "react";

import { GalleryStage, type StageSlot } from "@/components/GalleryStage";
import { photos } from "@/lib/gallery";

const MOBILE_BREAKPOINT_PX = 900;
const WHEEL_MIN_DELTA = 1;
const DESKTOP_SCROLL_SPEED = 0.0035;
const DESKTOP_SCROLL_EASING = 0.14;
const DESKTOP_SCROLL_STOP_EPSILON = 0.001;
// Require a longer finger movement before switching images on mobile.
const TOUCH_MIN_DELTA = 52;

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [desktopScrollPosition, setDesktopScrollPosition] = useState(0);
  const [expandedImageSrc, setExpandedImageSrc] = useState<string | null>(null);

  const desktopTargetScrollRef = useRef(0);
  const desktopAnimatedScrollRef = useRef(0);
  const desktopFrameRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  function animateDesktopScroll() {
    const delta = desktopTargetScrollRef.current - desktopAnimatedScrollRef.current;
    if (Math.abs(delta) <= DESKTOP_SCROLL_STOP_EPSILON) {
      desktopAnimatedScrollRef.current = desktopTargetScrollRef.current;
      setDesktopScrollPosition(desktopAnimatedScrollRef.current);
      desktopFrameRef.current = null;
      return;
    }

    desktopAnimatedScrollRef.current += delta * DESKTOP_SCROLL_EASING;
    setDesktopScrollPosition(desktopAnimatedScrollRef.current);
    desktopFrameRef.current = window.requestAnimationFrame(animateDesktopScroll);
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const syncViewportMode = () => {
      setIsMobile(mediaQuery.matches);
    };
    syncViewportMode();
    mediaQuery.addEventListener("change", syncViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (desktopFrameRef.current !== null) {
        window.cancelAnimationFrame(desktopFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Preload neighbors to keep carousel changes instant.
    const nextPhoto = photos[(mobileImageIndex + 1) % photos.length];
    const previousPhoto = photos[(mobileImageIndex - 1 + photos.length) % photos.length];
    [nextPhoto, previousPhoto].forEach((photo) => {
      const img = new window.Image();
      img.src = photo.src.src;
    });
  }, [mobileImageIndex]);

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    if (expandedImageSrc) {
      return;
    }

    event.preventDefault();
    if (Math.abs(event.deltaY) < WHEEL_MIN_DELTA) {
      return;
    }

    if (isMobile) {
      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      setMobileImageIndex((previous) => (previous + direction + photos.length) % photos.length);
      return;
    }

    // Keep wheel movement continuous so the cards glide instead of jumping.
    desktopTargetScrollRef.current += event.deltaY * DESKTOP_SCROLL_SPEED;
    if (desktopFrameRef.current === null) {
      desktopFrameRef.current = window.requestAnimationFrame(animateDesktopScroll);
    }
  };

  const desktopBaseIndex = Math.floor(desktopScrollPosition);
  const desktopProgress = desktopScrollPosition - desktopBaseIndex;
  const visibleSlots: StageSlot[] = isMobile
    ? [{ id: 0, imageIndex: mobileImageIndex }]
    : [-2, -1, 0, 1, 2].map((offset) => ({
        id: offset,
        imageIndex: (desktopBaseIndex + offset + photos.length * 1000) % photos.length
      }));

  const handleTouchStart = (touchY: number) => {
    touchStartYRef.current = touchY;
  };

  const handleTouchMove = (touchY: number) => {
    if (!isMobile || expandedImageSrc) {
      return;
    }
    const startY = touchStartYRef.current;
    if (startY === null) {
      return;
    }

    const deltaY = startY - touchY;
    if (Math.abs(deltaY) < TOUCH_MIN_DELTA) {
      return;
    }

    // Reset baseline after each accepted swipe step for smooth carousel scrolling.
    touchStartYRef.current = touchY;
    const direction: 1 | -1 = deltaY > 0 ? 1 : -1;
    setMobileImageIndex((previous) => (previous + direction + photos.length) % photos.length);
  };

  return (
    <main
      className={`home-page ${expandedImageSrc ? "is-hovering-image" : ""} ${isMobile ? "is-mobile" : ""}`}
      onWheel={handleWheel}
      onTouchStart={(event) => handleTouchStart(event.touches[0].clientY)}
      onTouchMove={(event) => {
        handleTouchMove(event.touches[0].clientY);
        if (isMobile && !expandedImageSrc) {
          event.preventDefault();
        }
      }}
      onTouchEnd={() => {
        touchStartYRef.current = null;
      }}
    >
      <nav className="home-menu" aria-label="Main menu">
        <p className="home-menu__name">Cédric Benet</p>
        <p>Instagram</p>
        <p>A propos</p>
        <p>Contact</p>
      </nav>
      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint__label">Scroll to explore gallery</span>
        <span className="scroll-hint__line" />
      </div>

      {/* Hide the mobile thumbnail while the fullscreen view is open. */}
      {!(isMobile && expandedImageSrc) ? (
        <GalleryStage
          slots={visibleSlots}
          isMobile={isMobile}
          desktopProgress={desktopProgress}
          hoveredSlotId={null}
          onImageClick={(slotId) => {
            if (!isMobile) {
              return;
            }
            const clickedSlot = visibleSlots.find((slot) => slot.id === slotId);
            if (!clickedSlot) {
              return;
            }
            setExpandedImageSrc(photos[clickedSlot.imageIndex].src.src);
          }}
          onHoverStart={() => {}}
          onHoverEnd={() => {}}
          onHoverMove={() => {}}
        />
      ) : null}

      {isMobile && expandedImageSrc ? (
        <button
          type="button"
          className="mobile-overlay-close"
          onClick={() => setExpandedImageSrc(null)}
          aria-label="Close image"
        />
      ) : null}
    </main>
  );
}
