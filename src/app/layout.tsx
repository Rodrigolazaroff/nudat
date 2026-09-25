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
    "Tu registro alimentario: cargá lo que comés y tomás cada día, con foto y horario.",
  applicationName: "nudat",
  // Instalada en iOS (Agregar a inicio): pantalla completa, con el nombre corto.
  appleWebApp: {
    capable: true,
    title: "nudat",
    statusBarStyle: "default",
  },
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
