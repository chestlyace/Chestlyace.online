import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";

// design.md §3: Bebas Neue (display), Inter as the fallback behind the system
// font (SF on Apple devices), JetBrains Mono (labels and code). Outfit is
// dropped (D38).
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontVariables = [
  bebasNeue.variable,
  inter.variable,
  jetbrainsMono.variable,
].join(" ");
