import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Texto: Plus Jakarta Sans (grotesca abierta, muy legible chica en el celu).
// Títulos y números grandes: Bricolage Grotesque (con carácter, usar con font-display).
const texto = Plus_Jakarta_Sans({
  variable: "--font-texto",
  subsets: ["latin"],
});

const titulos = Bricolage_Grotesque({
  variable: "--font-titulos",
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
  // Mismo crema que el fondo: la barra de estado se funde con la app.
  themeColor: "#f4f1e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${texto.variable} ${titulos.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-tinta">{children}</body>
    </html>
  );
}
