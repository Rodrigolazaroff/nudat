import type { MetadataRoute } from "next";

// Se sirve en /manifest.webmanifest (excluido del proxy, se lee sin sesión).
// Los PNG están en public/ y el proxy también los deja pasar (.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "nudat",
    short_name: "nudat",
    description:
      "Tu registro alimentario: cargá lo que comés y tomás cada día, con foto y horario.",
    lang: "es-AR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#2f6b4f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
