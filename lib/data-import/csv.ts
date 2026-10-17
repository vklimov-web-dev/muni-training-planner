import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";

import type { RawSources, SourceName } from "./types";

type SourceDefinition = {
  filename: string;
  encoding: "utf-8" | "windows-1250";
  delimiter: "," | ";";
  columns: readonly string[];
};

const SOURCE_DEFINITIONS: Record<SourceName, SourceDefinition> = {
  employees: {
    filename: "zamestnanci.csv",
    encoding: "utf-8",
    delimiter: ",",
    columns: [
      "id_zamestnance",
      "jmeno",
      "prijmeni",
      "email",
      "utvar",
      "pozice",
      "vedouci_email",
      "datum_nastupu",
      "datum_ukonceni",
      "stav",
      "rodne_cislo",
      "poznamka",
    ],
  },
  catalog: {
    filename: "katalog_skoleni.csv",
    encoding: "utf-8",
    delimiter: ",",
    columns: ["kod", "nazev", "platnost_mesicu", "povinne_pro", "poznamka"],
  },
  sessions: {
    filename: "terminy_skoleni.csv",
    encoding: "utf-8",
    delimiter: ";",
    columns: [
      "id_terminu",
      "kod_skoleni",
      "datum",
      "cas",
      "misto",
      "kapacita",
      "obsazeno",
      "cena_na_osobu",
      "stav",
    ],
  },
  completions: {
    filename: "absolvovana_skoleni.csv",
    encoding: "windows-1250",
    delimiter: ";",
    columns: [
      "id_zaznamu",
      "id_zamestnance",
      "zamestnanec",
      "kod_skoleni",
      "datum_absolvovani",
      "platnost_do",
      "poskytovatel",
      "cena_kc",
      "poznamka",
    ],
  },
};

function assertColumns(
  source: SourceName,
  rows: Record<string, string>[],
  expectedColumns: readonly string[],
): void {
  if (!rows[0]) {
    throw new Error(`Source ${source} does not contain any data rows.`);
  }

  const actualColumns = Object.keys(rows[0]);
  if (
    actualColumns.length !== expectedColumns.length ||
    actualColumns.some((column, index) => column !== expectedColumns[index])
  ) {
    throw new Error(`Source ${source} has an unexpected header.`);
  }
}

export function parseCsvSource(
  source: SourceName,
  buffer: Buffer,
): Record<string, string>[] {
  const definition = SOURCE_DEFINITIONS[source];
  const decoded = new TextDecoder(definition.encoding, { fatal: true }).decode(
    buffer,
  );
  const rows = parse(decoded, {
    bom: true,
    columns: true,
    delimiter: definition.delimiter,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  assertColumns(source, rows, definition.columns);
  return rows;
}

export async function readRawSources(rootDirectory: string): Promise<RawSources> {
  const entries = await Promise.all(
    Object.entries(SOURCE_DEFINITIONS).map(async ([source, definition]) => {
      const buffer = await readFile(path.join(rootDirectory, definition.filename));
      return [source, parseCsvSource(source as SourceName, buffer)] as const;
    }),
  );

  return Object.fromEntries(entries) as RawSources;
}
