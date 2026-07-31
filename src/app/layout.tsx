import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Serif_Display } from "next/font/google";
import Script from "next/script";
import { ToastContainer } from "@/components/ui/toast";
import "./globals.css";

const cabinetGrotesk = localFont({
  src: [
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-Regular.otf",   weight: "400", style: "normal" },
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-Medium.otf",    weight: "500", style: "normal" },
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-Bold.otf",      weight: "700", style: "normal" },
    { path: "../fonts/cabinet-grotesk/CabinetGrotesk-Extrabold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

const figtree = localFont({
  src: [
    { path: "../fonts/figtree/Figtree-VariableFont_wght.ttf",        style: "normal" },
    { path: "../fonts/figtree/Figtree-Italic-VariableFont_wght.ttf", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anchora | Digital Financial Legacy Platform",
  description: "Organise your financial life safely for the people you love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cabinetGrotesk.variable} ${figtree.variable} ${dmSerifDisplay.variable}`}>
      <body className="antialiased font-sans bg-background text-foreground">
        {children}
        <ToastContainer />
        <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
