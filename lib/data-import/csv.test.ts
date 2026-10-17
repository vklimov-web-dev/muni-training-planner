import { parseCsvSource } from "./csv";

describe("parseCsvSource", () => {
  it("decodes the Windows-1250 completion export", () => {
    const header =
      "id_zaznamu;id_zamestnance;zamestnanec;kod_skoleni;datum_absolvovani;platnost_do;poskytovatel;cena_kc;poznamka\r\n";
    const rowStart = "Z1;E1;Nov";
    const rowEnd =
      " Hana;BOZP-Z;1. 1. 2025;1. 1. 2027;Dodavatel;0,00;\r\n";
    const buffer = Buffer.concat([
      Buffer.from(header + rowStart, "ascii"),
      Buffer.from([0xe1]),
      Buffer.from(rowEnd, "ascii"),
    ]);

    const rows = parseCsvSource("completions", buffer);

    expect(rows).toHaveLength(1);
    expect(rows[0].zamestnanec).toBe("Nová Hana");
  });
});
