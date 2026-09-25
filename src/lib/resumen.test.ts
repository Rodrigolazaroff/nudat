import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TipoComida } from "@/lib/database.types";
import { calcularResumen, rachaActual, registrosPorDia } from "@/lib/resumen";

type Fila = { fecha: string; hora: string; tipo: TipoComida; foto_path: string | null };

const c = (fecha: string, hora: string, tipo: TipoComida = "almuerzo"): Fila => ({
  fecha,
  hora,
  tipo,
  foto_path: null,
});

describe("calcularResumen (comportamiento existente)", () => {
  it("cuenta lo de madrugada para el día anterior y promedia cruzando la medianoche", () => {
    const r = calcularResumen(
      [c("2026-09-21", "23:30", "cena"), c("2026-09-23", "00:30", "cena")],
      "2026-09-21",
      "2026-09-22",
    );
    assert.equal(r.diasConRegistro, 2);
    assert.equal(r.porTipo.find((t) => t.tipo === "cena")!.horario!.promedio, 24 * 60);
    assert.equal(r.cenasTarde.cantidad, 2);
  });

  it("las bebidas no cuentan para primera comida ni ayuno", () => {
    const r = calcularResumen(
      [
        c("2026-09-21", "21:00", "cena"),
        c("2026-09-21", "23:00", "bebida"),
        c("2026-09-22", "06:00", "bebida"),
        c("2026-09-22", "08:00", "desayuno"),
      ],
      "2026-09-21",
      "2026-09-22",
    );
    assert.equal(r.primeraComida!.promedio, (21 * 60 + 8 * 60) / 2);
    assert.equal(r.ayunoNocturno!.promedio, 11 * 60);
  });
});

describe("registrosPorDia", () => {
  it("devuelve todos los días del período, con comidas y bebidas separadas", () => {
    const dias = registrosPorDia(
      [
        c("2026-09-21", "08:00", "desayuno"),
        c("2026-09-21", "10:00", "bebida"),
        c("2026-09-23", "13:00", "almuerzo"),
      ],
      "2026-09-21",
      "2026-09-23",
    );
    assert.deepEqual(dias, [
      { fecha: "2026-09-21", total: 2, comidas: 1, bebidas: 1 },
      { fecha: "2026-09-22", total: 0, comidas: 0, bebidas: 0 },
      { fecha: "2026-09-23", total: 1, comidas: 1, bebidas: 0 },
    ]);
  });

  it("respeta el día alimentario: antes de las 05:00 cuenta para el día anterior", () => {
    const dias = registrosPorDia(
      [c("2026-09-22", "01:30", "cena"), c("2026-09-22", "05:00", "desayuno")],
      "2026-09-21",
      "2026-09-22",
    );
    assert.deepEqual(
      dias.map((d) => [d.fecha, d.total]),
      [
        ["2026-09-21", 1],
        ["2026-09-22", 1],
      ],
    );
  });

  it("descarta lo que cae fuera del período y devuelve vacío si el período es inválido", () => {
    const dias = registrosPorDia(
      [c("2026-09-20", "12:00"), c("2026-09-24", "04:59", "cena"), c("2026-09-25", "12:00")],
      "2026-09-21",
      "2026-09-23",
    );
    // 24 a las 04:59 → día 23.
    assert.deepEqual(
      dias.map((d) => d.total),
      [0, 0, 1],
    );
    assert.deepEqual(registrosPorDia([], "2026-09-23", "2026-09-21"), []);
  });
});

describe("rachaActual", () => {
  const hoy = "2026-09-25";

  it("cuenta los días seguidos terminando hoy", () => {
    const r = rachaActual(
      [c("2026-09-23", "12:00"), c("2026-09-24", "12:00"), c("2026-09-25", "09:00")],
      hoy,
    );
    assert.deepEqual(r, { dias: 3, incluyeHoy: true });
  });

  it("si hoy todavía está vacío, no corta la racha: cuenta hasta ayer", () => {
    const r = rachaActual([c("2026-09-23", "12:00"), c("2026-09-24", "12:00")], hoy);
    assert.deepEqual(r, { dias: 2, incluyeHoy: false });
  });

  it("un día vacío en el medio corta la racha", () => {
    const r = rachaActual(
      [c("2026-09-21", "12:00"), c("2026-09-22", "12:00"), c("2026-09-24", "12:00")],
      hoy,
    );
    assert.deepEqual(r, { dias: 1, incluyeHoy: false });
  });

  it("es 0 si ni hoy ni ayer tienen registros", () => {
    assert.deepEqual(rachaActual([c("2026-09-22", "12:00")], hoy), { dias: 0, incluyeHoy: false });
    assert.deepEqual(rachaActual([], hoy), { dias: 0, incluyeHoy: false });
  });

  it("usa el día alimentario: lo de madrugada de hoy es de ayer", () => {
    // Hoy a las 02:00 cuenta para ayer; hoy en sí sigue vacío.
    const r = rachaActual([c("2026-09-24", "12:00"), c("2026-09-25", "02:00", "cena")], hoy);
    assert.deepEqual(r, { dias: 1, incluyeHoy: false });
  });

  it("cuenta las bebidas como registro y cruza meses", () => {
    const r = rachaActual(
      [c("2026-08-31", "10:00", "bebida"), c("2026-09-01", "10:00", "bebida")],
      "2026-09-01",
    );
    assert.deepEqual(r, { dias: 2, incluyeHoy: true });
  });

  it("ignora filas con hora inválida y devuelve 0 si hoy no es una fecha válida", () => {
    assert.deepEqual(rachaActual([c(hoy, "25:00")], hoy), { dias: 0, incluyeHoy: false });
    assert.deepEqual(rachaActual([c(hoy, "12:00")], "hoy"), { dias: 0, incluyeHoy: false });
  });
});
