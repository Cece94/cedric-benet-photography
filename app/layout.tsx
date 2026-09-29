import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-cormorant"
});

const description =
  "Cédric Benet, photographe. Ambiances du Grand Nord : Nordic Noir (Islande, Norvège), Hautes terres (Laugavegur). Exposé à ImageNation Paris 2023.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cedric-benet-photography.vercel.app"),
  title: "Cédric Benet | Photographe",
  description,
  keywords: ["Cédric Benet", "photographe", "photographie", "Nordic Noir", "Islande", "Norvège", "Lofoten", "exposition photo"],
  openGraph: {
    title: "Cédric Benet | Photographe",
    description,
    url: "/",
    siteName: "Cédric Benet",
    locale: "fr_FR",
    type: "website"
  },
  twitter: { card: "summary_large_image", title: "Cédric Benet | Photographe", description }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${cormorant.variable}`}>{children}</body>
    </html>
  );
}
