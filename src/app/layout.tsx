import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "nudat",
    template: "%s · nudat",
  },
  description:
    "Registro alimentario: cargá tus comidas desde el celular y tu nutricionista las ve.",
  applicationName: "nudat",
};

export const viewport: Viewport = {
  themeColor: "#2f6b4f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo text-tinta">{children}</body>
    </html>
  );
}
