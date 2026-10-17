# Přehled povinných školení

Webová aplikace pro vyhodnocení platnosti povinných školení a návrh zaměstnanců na dostupné termíny.

Plánovaný stack: Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL a Prisma ORM. Aplikace bude nasazena na Vercel; databázové dotazy poběží pouze na serveru.

## Vývoj

Požadavky:

- Node.js 22+
- npm 11+

Příkazy:

```bash
npm install
npm run dev
npm run check
```

Lokální aplikace je dostupná na `http://localhost:3000`, kontrola stavu na `http://localhost:3000/api/health`.

Zdrojové CSV exporty zůstávají pouze v lokálním prostředí. Do repozitáře a veřejného buildu se smí dostat jen explicitně povolená, sanitizovaná data.

Průběžná rozhodnutí jsou v [`docs/DECISIONS.md`](docs/DECISIONS.md), stručný záznam o použití AI v [`docs/AI_JOURNAL.md`](docs/AI_JOURNAL.md).
