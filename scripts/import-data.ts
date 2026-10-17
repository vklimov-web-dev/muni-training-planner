import "dotenv/config";

import { readRawSources } from "../lib/data-import/csv";
import { importSources } from "../lib/data-import/import";
import { createImportReport } from "../lib/data-import/report";
import { getPrismaClient } from "../lib/prisma";

const rawSources = await readRawSources(process.cwd());
const result = importSources(rawSources);
const prisma = getPrismaClient();

try {
  await prisma.$transaction(async (transaction) => {
    await transaction.trainingCompletion.deleteMany();
    await transaction.trainingSession.deleteMany();
    await transaction.trainingRequirement.deleteMany();
    await transaction.employee.deleteMany();
    await transaction.training.deleteMany();

    await transaction.training.createMany({ data: result.data.trainings });
    await transaction.employee.createMany({ data: result.data.employees });
    await transaction.trainingRequirement.createMany({
      data: result.data.requirements,
    });
    await transaction.trainingSession.createMany({
      data: result.data.sessions,
    });
    await transaction.trainingCompletion.createMany({
      data: result.data.completions,
    });
  });

  console.log(JSON.stringify(createImportReport(result), null, 2));
} finally {
  await prisma.$disconnect();
}
