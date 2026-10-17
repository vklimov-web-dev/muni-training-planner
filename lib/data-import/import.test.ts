import { importSources } from "./import";
import type { RawSources } from "./types";

function createSources(): RawSources {
  return {
    employees: [
      {
        id_zamestnance: "E1",
        jmeno: "Jana",
        prijmeni: "Nová",
        email: "jana@example.test",
        utvar: "Správa budov",
        pozice: "Technik údržby",
        vedouci_email: "",
        datum_nastupu: "1. 1. 2020",
        datum_ukonceni: "",
        stav: "aktivní",
        rodne_cislo: "synthetic-sensitive-value",
        poznamka: "must not be imported",
      },
    ],
    catalog: [
      {
        kod: "ZDVIH",
        nazev: "Obsluha zdvihacích zařízení",
        platnost_mesicu: "2 roky",
        povinne_pro: "POZICE:Technik údržby",
        poznamka: "",
      },
    ],
    sessions: [
      {
        id_terminu: "T1",
        kod_skoleni: "zdvih",
        datum: "15. 10. 2026",
        cas: "09:00-12:00",
        misto: "Učebna",
        kapacita: "10",
        obsazeno: "12",
        cena_na_osobu: "2 100 Kč",
        stav: "plánováno",
      },
      {
        id_terminu: "T2",
        kod_skoleni: "KYB3R",
        datum: "31. 9. 2026",
        cas: "09:00-12:00",
        misto: "Učebna",
        kapacita: "10",
        obsazeno: "0",
        cena_na_osobu: "",
        stav: "plánováno",
      },
      {
        id_terminu: "T3",
        kod_skoleni: "ZDVIH",
        datum: "15. 10. 2026",
        cas: "09:00-12:00",
        misto: "Učebna",
        kapacita: "20",
        obsazeno: "0",
        cena_na_osobu: "2 100 Kč",
        stav: "plánováno",
      },
    ],
    completions: [
      {
        id_zaznamu: "Z1",
        id_zamestnance: "E1",
        zamestnanec: "Nová Jana",
        kod_skoleni: "zdvih",
        datum_absolvovani: "30. 9. 2026",
        platnost_do: "30. 9. 2028",
        poskytovatel: "Dodavatel",
        cena_kc: "2 100,00",
        poznamka: "must not be imported",
      },
      {
        id_zaznamu: "Z2",
        id_zamestnance: "E1",
        zamestnanec: "Nová Jana",
        kod_skoleni: "ZDVIH",
        datum_absolvovani: "2. 10. 2026",
        platnost_do: "2. 10. 2027",
        poskytovatel: "Dodavatel",
        cena_kc: "0,00",
        poznamka: "",
      },
      {
        id_zaznamu: "id_zaznamu",
        id_zamestnance: "id_zamestnance",
        zamestnanec: "zamestnanec",
        kod_skoleni: "kod_skoleni",
        datum_absolvovani: "datum_absolvovani",
        platnost_do: "platnost_do",
        poskytovatel: "poskytovatel",
        cena_kc: "cena_kc",
        poznamka: "poznamka",
      },
    ],
  };
}

describe("importSources", () => {
  it("normalizes valid rows and excludes sensitive source fields", () => {
    const result = importSources(createSources());

    expect(result.data.trainings).toEqual([
      {
        code: "ZDVIH",
        name: "Obsluha zdvihacích zařízení",
        validityMonths: 24,
      },
    ]);
    expect(result.data.employees[0]).toMatchObject({
      id: "E1",
      unitKey: "sprava budov",
      positionKey: "technik udrzby",
    });
    expect(result.data.employees[0]).not.toHaveProperty("email");
    expect(result.data.employees[0]).not.toHaveProperty("rodne_cislo");
    expect(result.data.completions[0]).not.toHaveProperty("poznamka");
    expect(result.data.completions[0]).not.toHaveProperty("cena_kc");
  });

  it("keeps usable anomalies visible and rejects unsafe rows", () => {
    const result = importSources(createSources());

    expect(result.data.sessions).toHaveLength(1);
    expect(result.data.completions).toHaveLength(2);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "catalog",
          code: "normalized_value",
          severity: "warning",
        }),
        expect.objectContaining({
          source: "sessions",
          code: "over_capacity",
          severity: "warning",
        }),
        expect.objectContaining({
          source: "sessions",
          code: "invalid_date",
          severity: "rejected",
        }),
        expect.objectContaining({
          source: "sessions",
          code: "duplicate_session",
          severity: "rejected",
        }),
        expect.objectContaining({
          source: "completions",
          code: "future_record",
          severity: "warning",
        }),
        expect.objectContaining({
          source: "completions",
          code: "expiry_mismatch",
          severity: "warning",
        }),
        expect.objectContaining({
          source: "completions",
          code: "repeated_header",
          severity: "rejected",
        }),
      ]),
    );
  });
});
