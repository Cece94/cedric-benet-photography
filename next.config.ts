import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF keeps full colour resolution (WebP always halves it) and is
    // smaller at equal quality. Next encodes AVIF at quality - 20, so the
    // components request 100 to get AVIF q80.
    formats: ["image/avif", "image/webp"],
    qualities: [100]
  }
};

export default nextConfig;
