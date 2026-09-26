import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TipoComida } from "@/lib/database.types";
import { calcularResumen, registrosPorDia } from "@/lib/resumen";

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

describe("calcularResumen: comidas y bebidas por separado", () => {
  it("promedioComidasPorDia no cuenta bebidas; promedioPorDia sigue contando todo", () => {
    const r = calcularResumen(
      [
        c("2026-09-21", "08:00", "desayuno"),
        c("2026-09-21", "10:00", "bebida"),
        c("2026-09-21", "13:00", "almuerzo"),
        c("2026-09-22", "09:00", "bebida"),
        c("2026-09-22", "21:00", "cena"),
      ],
      "2026-09-21",
      "2026-09-23",
    );
    assert.equal(r.totalRegistros, 5);
    assert.equal(r.totalComidas, 3);
    assert.equal(r.totalBebidas, 2);
    assert.equal(r.diasConRegistro, 2);
    assert.equal(r.promedioPorDia, 5 / 2);
    assert.equal(r.promedioComidasPorDia, 3 / 2);
  });

  it("un día con solo bebidas es un día con registros: entra en el promedio y se evalúa", () => {
    const r = calcularResumen(
      [c("2026-09-21", "13:00", "almuerzo"), c("2026-09-22", "10:00", "bebida")],
      "2026-09-21",
      "2026-09-22",
    );
    assert.equal(r.promedioComidasPorDia, 1 / 2);
    assert.equal(r.salteadas.diasEvaluados, 2);
    // El 22 no tiene ninguna comida principal registrada.
    assert.deepEqual(r.salteadas.porDia.find((d) => d.fecha === "2026-09-22")?.faltan, [
      "desayuno",
      "almuerzo",
      "merienda",
      "cena",
    ]);
    // Pero no tiene horarios de comida.
    assert.equal(r.primeraComida!.cantidad, 1);
  });

  it("sin registros los promedios son null y los totales 0", () => {
    const r = calcularResumen([], "2026-09-21", "2026-09-27");
    assert.equal(r.promedioComidasPorDia, null);
    assert.equal(r.promedioPorDia, null);
    assert.equal(r.totalComidas, 0);
    assert.equal(r.totalBebidas, 0);
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
