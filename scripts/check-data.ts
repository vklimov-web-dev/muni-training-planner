import { readRawSources } from "../lib/data-import/csv";
import { importSources } from "../lib/data-import/import";
import { createImportReport } from "../lib/data-import/report";

const rawSources = await readRawSources(process.cwd());
const result = importSources(rawSources);

console.log(JSON.stringify(createImportReport(result), null, 2));
