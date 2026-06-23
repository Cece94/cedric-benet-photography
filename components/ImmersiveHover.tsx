"use client";

import { motion, AnimatePresence } from "framer-motion";

type ImmersiveHoverProps = {
  imageSrc: string | null;
  panX: number;
  panY: number;
};

export function ImmersiveHover({ imageSrc, panX, panY }: ImmersiveHoverProps) {
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
            style={{
              backgroundImage: `url(${imageSrc})`,
              backgroundPosition: `${panX}% ${panY}%`
            }}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            exit={{ scale: 1.03 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
