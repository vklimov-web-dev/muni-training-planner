# Přehled povinných školení

Webová aplikace pro vyhodnocení platnosti povinných školení a návrh zaměstnanců na dostupné termíny.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL a Prisma ORM. Aplikace bude nasazena na Vercel; databázové dotazy poběží pouze na serveru.

## Co aplikace ukazuje

- souhrn aktivních zaměstnanců a stavů `chybí`, `propadlé`, `končí brzy` a `platné` k pevnému datu exportu;
- filtrovatelný přehled povinných kombinací zaměstnance a školení;
- filtrovatelná doporučení konkrétních osob na plánované termíny podle naléhavosti a zbývající kapacity;
- případy, které nelze vyřešit před koncem platnosti, a termíny s překročenou kapacitou.

Varianty názvů útvarů se ve filtru slučují přes normalizovaný klíč, ale v jednotlivých záznamech zůstává vidět původní hodnota z exportu. Aplikace data pouze čte; registraci na termín neprovádí.

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

## Nasazení na Vercel

1. Pro cílovou Neon databázi spusťte z důvěryhodného lokálního prostředí
   `npm run db:migrate:deploy` a poté `npm run db:import`.
2. Importujte GitHub repozitář do Vercelu jako Next.js projekt.
3. Ve Vercelu nastavte tajné proměnné `DATABASE_URL` (pooled připojení) a
   `DIRECT_URL` (přímé připojení pro Prisma CLI). Nepoužívejte prefix
   `NEXT_PUBLIC_`.
4. Nasaďte aplikaci a ověřte hlavní stránku a `/api/health`. Endpoint vrací
   `200`, pouze pokud je dostupná i databáze, jinak `503`; technické podrobnosti
   připojení nezveřejňuje.

Migrace nejsou součástí build příkazu. Preview nebo opakovaný deployment tak
nemůže vedlejším efektem změnit databázové schéma. Vercel používá standardní
`npm run build`; zvláštní `vercel.json` není potřeba.

GitHub Actions na každém pull requestu a změně hlavní větve provede čistou
instalaci a `npm run check`.
