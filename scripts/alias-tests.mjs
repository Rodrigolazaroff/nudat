// Deja correr los tests .ts con `node --test` (Node 24 saca los tipos solo):
// resuelve el alias `@/` → `src/` y agrega la extensión .ts que Node exige.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = new URL("../src/", import.meta.url);

registerHooks({
  resolve(especificador, contexto, siguiente) {
    let url = null;
    if (especificador.startsWith("@/")) url = new URL(especificador.slice(2), src);
    else if (especificador.startsWith(".") && contexto.parentURL?.startsWith("file:"))
      url = new URL(especificador, contexto.parentURL);

    if (url && !/\.[cm]?[jt]sx?$/.test(url.pathname)) {
      for (const ext of [".ts", ".tsx", "/index.ts"]) {
        const candidato = new URL(url.href + ext);
        if (existsSync(fileURLToPath(candidato))) return siguiente(candidato.href, contexto);
      }
    }
    if (url) return siguiente(url.href, contexto);
    return siguiente(especificador, contexto);
  },
});
