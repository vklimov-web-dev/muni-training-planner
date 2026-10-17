# Projektová rozhodnutí

Tento soubor zachycuje pouze rozhodnutí, která ovlivňují rozsah, interpretaci dat, bezpečnost nebo provoz aplikace. Nejde o deník všech kroků.

## 2026-10-17 — Rozsah MVP

- **Rozhodnutí:** MVP ukáže stav povinných školení, blížící se konce platnosti, chybějící a propadlá školení a doporučení zaměstnanců na konkrétní termíny s ohledem na kapacitu.
- **Důvod:** Tyto výstupy přímo odpovídají rozhodnutím, která mají vedoucí a personální oddělení dělat.
- **Mimo MVP:** editace dat, registrace uživatelů, notifikace, exporty, detail zaměstnance, grafy a AI/RAG funkce. Pro testovací zadání by nepřinesly dostatečnou hodnotu vzhledem k časovému limitu.

## 2026-10-17 — Referenční datum

- **Rozhodnutí:** Všechny výpočty platnosti budou vyhodnoceny k `2026-10-01`, nikoli k aktuálnímu systémovému datu.
- **Důvod:** Zadání uvádí, že export vznikl 1. 10. 2026. Pevné datum zajišťuje reprodukovatelné výsledky.

## 2026-10-17 — Aplikační architektura

- **Rozhodnutí:** Next.js App Router, TypeScript a Tailwind CSS; PostgreSQL s Prisma ORM; nasazení na Vercel. Jako bezplatný PostgreSQL provider je předběžně zvolen Neon.
- **Důvod:** Jedna aplikace pokryje serverovou i klientskou část, ukáže práci se SQL/datovým modelem a omezí množství provozní infrastruktury.
- **Důsledek:** Prisma bude dostupná pouze v serverové datové vrstvě. Klientské komponenty dostanou jen minimální serializovatelné DTO, nikoli databázové připojení nebo citlivá zdrojová pole.

## 2026-10-17 — Správa závislostí

- **Rozhodnutí:** Projekt používá npm 11 a commitovaný `package-lock.json`.
- **Důvod:** npm je součástí standardní instalace Node.js a pro samostatnou aplikaci odstraňuje zbytečný požadavek na další package manager.
- **Bezpečnost:** Automatický `npm audit --force` se nepoužívá. Závislosti byly upraveny tak, aby čistá instalace skončila bez hlášených zranitelností.

## 2026-10-17 — Zacházení se zdrojovými daty

- **Rozhodnutí:** Původní CSV soubory se necommitují ani nenasazují. Import bude deterministický, validační chyby se zaznamenají a do databáze se uloží pouze pole nutná pro dashboard a plánování.
- **Vynechaná pole:** rodná čísla, e-maily po vyhodnocení vazby na vedoucího, volné poznámky a další nepotřebné identifikátory.
- **Důvod:** Data jsou sice syntetická, ale aplikace má demonstrovat stejnou minimalizaci dat, jaká by byla nutná v produkci.

## 2026-10-17 — Doporučování termínů

- **Rozhodnutí:** Doporučení bude vysvětlitelné a deterministické, založené na povinnosti školení, naléhavosti, způsobilosti termínu a zbývající kapacitě.
- **Důvod:** Pro tento problém je auditovatelné pravidlo vhodnější než LLM. Uživatel musí rozumět, proč byl člověk doporučen a proč někdo termín nemá.
