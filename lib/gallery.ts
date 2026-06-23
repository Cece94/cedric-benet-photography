import type { StaticImageData } from "next/image";

import DSC01136 from "@/DSC01136.jpg";
import DSC01974Enhanced from "@/DSC01974-Enhanced-NR.jpg";
import DSC02193 from "@/DSC02193.jpg";
import DSC02252 from "@/DSC02252.jpg";
import DSC02412 from "@/DSC02412.jpg";
import DSC02418 from "@/DSC02418.jpg";
import DSC02784 from "@/DSC02784.jpg";
import DSC07112 from "@/DSC07112.jpg";

export type PhotoItem = {
  id: string;
  src: StaticImageData;
  alt: string;
  year: string;
  series: string;
};

export type SlotLayout = {
  left: string;
  top: string;
  width: string;
};

export const photos: PhotoItem[] = [
  {
    id: "dsc01136",
    src: DSC01136,
    alt: "Urban silhouette",
    year: "2024",
    series: "Noir Fragments"
  },
  {
    id: "dsc01974",
    src: DSC01974Enhanced,
    alt: "Monochrome portrait",
    year: "2024",
    series: "Noir Fragments"
  },
  {
    id: "dsc02193",
    src: DSC02193,
    alt: "Diagonal light architecture",
    year: "2023",
    series: "Architectural Study"
  },
  {
    id: "dsc02252",
    src: DSC02252,
    alt: "Street reflection details",
    year: "2023",
    series: "City Lines"
  },
  {
    id: "dsc02412",
    src: DSC02412,
    alt: "City motion and lines",
    year: "2022",
    series: "City Lines"
  },
  {
    id: "dsc02418",
    src: DSC02418,
    alt: "Abstract urban geometry",
    year: "2022",
    series: "Architectural Study"
  },
  {
    id: "dsc02784",
    src: DSC02784,
    alt: "Perspective and shadows",
    year: "2021",
    series: "Shadows"
  },
  {
    id: "dsc07112",
    src: DSC07112,
    alt: "Texture and depth study",
    year: "2021",
    series: "Shadows"
  }
];

export const slotLayouts: SlotLayout[] = [
  // Larger slots improve readability while staying responsive across screens.
  { left: "5%", top: "30%", width: "clamp(200px, 18vw, 360px)" },
  { left: "24%", top: "30%", width: "clamp(200px, 18vw, 360px)" },
  { left: "43%", top: "30%", width: "clamp(200px, 18vw, 360px)" },
  { left: "62%", top: "30%", width: "clamp(200px, 18vw, 360px)" },
  { left: "81%", top: "30%", width: "clamp(200px, 18vw, 360px)" }
];
