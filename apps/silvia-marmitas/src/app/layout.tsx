import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silvia Marmitas & Lanches — Peça direto",
  description: "Cardápio próprio da Silvia Marmitas & Lanches: peça direto e pague menos que no iFood.",
};
export const viewport: Viewport = { themeColor: "#ea1d2c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
