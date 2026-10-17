# Přehled povinných školení

Webová aplikace pro vyhodnocení platnosti povinných školení a návrh zaměstnanců na dostupné termíny.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL a Prisma ORM. Aplikace bude nasazena na Vercel; databázové dotazy poběží pouze na serveru.

## Vývoj

Požadavky:

- Node.js 22+
- npm 11+

Příkazy:

```bash
npm install
npm run data:check
npm run dev
npm run check
```

Lokální aplikace je dostupná na `http://localhost:3000`, kontrola stavu na `http://localhost:3000/api/health`.

## Databáze a import

1. Zkopírujte `.env.example` do `.env`. Pro Neon nastavte pooled `DATABASE_URL`
   pro běh aplikace a přímé `DIRECT_URL` pro Prisma migrace.
2. Vložte čtyři dodané CSV soubory do kořene projektu pod původními názvy.
3. Spusťte migrace a nejprve zkontrolujte import bez zápisu:

```bash
npm run db:migrate
npm run data:check
```

4. Naplňte vyhrazenou databázi:

```bash
npm run db:import
```

`db:import` v jedné transakci nahradí aplikační data obsahem exportů. Je proto určen pouze pro samostatnou databázi této aplikace. Výstup obsahuje jen souhrnné počty chyb a varování, nikoli hodnoty z osobních záznamů.

Zdrojové CSV exporty zůstávají pouze v lokálním prostředí. Git je ignoruje a do veřejného buildu se nedostanou. Import neukládá rodná čísla, e-mailové adresy, volné poznámky, poskytovatele ani ceny. E-mail se použije pouze v paměti k dohledání vztahu vedoucí–zaměstnanec.

Průběžná rozhodnutí jsou v [`docs/DECISIONS.md`](docs/DECISIONS.md), stručný záznam o použití AI v [`docs/AI_JOURNAL.md`](docs/AI_JOURNAL.md).
