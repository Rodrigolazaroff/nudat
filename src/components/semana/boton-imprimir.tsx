"use client";

import { ui } from "./ui";

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className={`${ui.botonSecundario} print:hidden`}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
        <path
          fillRule="evenodd"
          d="M5 2.75A.75.75 0 0 1 5.75 2h8.5a.75.75 0 0 1 .75.75V6h.25A2.75 2.75 0 0 1 18 8.75v4.5A1.75 1.75 0 0 1 16.25 15H15v2.25a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75V15H3.75A1.75 1.75 0 0 1 2 13.25v-4.5A2.75 2.75 0 0 1 4.75 6H5V2.75ZM13.5 6V3.5h-7V6h7Zm-7 7.5v3h7v-3h-7Z"
          clipRule="evenodd"
        />
      </svg>
      Imprimir
    </button>
  );
}
