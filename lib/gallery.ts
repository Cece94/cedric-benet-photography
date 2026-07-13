import type { StaticImageData } from "next/image";

import DSC01136 from "@/DSC01136.jpg";
import DSC01974Enhanced from "@/DSC01974-Enhanced-NR.jpg";
import DSC02193 from "@/DSC02193.jpg";
import DSC02252 from "@/DSC02252.jpg";
import DSC02412 from "@/DSC02412.jpg";
import DSC02418 from "@/DSC02418.jpg";
import DSC02784 from "@/DSC02784.jpg";
import DSC07112 from "@/DSC07112.jpg";

/** Controls each photo's width and horizontal placement in the editorial flow. */
export type PhotoLayout = "full" | "wide-left" | "wide-right" | "portrait-center" | "portrait-right";

export type PhotoItem = {
  id: string;
  src: StaticImageData;
  alt: string;
  title: string;
  year: string;
  layout: PhotoLayout;
};

export const photos: PhotoItem[] = [
  {
    id: "dsc01136",
    src: DSC01136,
    alt: "Fishing village under snowy mountains at dusk, Lofoten",
    title: "Village — Lofoten",
    year: "2026",
    layout: "full"
  },
  {
    id: "dsc01974",
    src: DSC01974Enhanced,
    alt: "Midnight sun over the Norwegian sea and mountains",
    title: "Mer de Norvège",
    year: "2026",
    layout: "wide-right"
  },
  {
    id: "dsc02193",
    src: DSC02193,
    alt: "White-tailed eagle in flight",
    title: "Pygargue",
    year: "2026",
    layout: "portrait-center"
  },
  {
    id: "dsc02252",
    src: DSC02252,
    alt: "Eagle catching a fish in front of snowy peaks, black and white",
    title: "La prise",
    year: "2026",
    layout: "wide-left"
  },
  {
    id: "dsc02412",
    src: DSC02412,
    alt: "Cod drying racks, black and white",
    title: "Séchoirs",
    year: "2026",
    layout: "full"
  },
  {
    id: "dsc02418",
    src: DSC02418,
    alt: "Stockfish rack on a rocky shore, black and white",
    title: "Stockfisch",
    year: "2026",
    layout: "portrait-right"
  },
  {
    id: "dsc02784",
    src: DSC02784,
    alt: "Green aurora borealis over silhouetted trees",
    title: "Aurore",
    year: "2026",
    layout: "portrait-center"
  },
  {
    id: "dsc07112",
    src: DSC07112,
    alt: "Volcanic highlands under a stormy sky, Iceland",
    title: "Hautes terres — Islande",
    year: "2025",
    layout: "wide-left"
  }
];
