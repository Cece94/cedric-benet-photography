"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ImmersiveHoverProps = {
  imageSrc: string | null;
  panX: number;
  panY: number;
};

export function ImmersiveHover({ imageSrc, panX, panY }: ImmersiveHoverProps) {
  const [isPointerTracking, setIsPointerTracking] = useState(false);

  useEffect(() => {
    setIsPointerTracking(false);
  }, [imageSrc]);

  return (
    <AnimatePresence>
      {imageSrc ? (
        <motion.div
          key={imageSrc}
          className="immersive-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <motion.div
            className="immersive-overlay__image"
            style={{ backgroundImage: `url(${imageSrc})` }}
            initial={{ scale: 1.08, backgroundPosition: "50% 50%" }}
            animate={{ scale: 1, backgroundPosition: `${panX}% ${panY}%` }}
            exit={{ scale: 1.03 }}
            onAnimationComplete={() => {
              // First move stays quick, then hover tracking becomes smoother/slower.
              if (!isPointerTracking) {
                setIsPointerTracking(true);
              }
            }}
            transition={{
              scale: { duration: 0.45, ease: "easeOut" },
              backgroundPosition: {
                duration: isPointerTracking ? 0.58 : 0.24,
                ease: "easeOut"
              }
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
