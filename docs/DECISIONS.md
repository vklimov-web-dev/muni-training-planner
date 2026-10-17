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

## 2026-10-17 — Připojení k databázi

- **Rozhodnutí:** Produkční databáze běží v Neon PostgreSQL v regionu Frankfurt. Aplikace používá pooled `DATABASE_URL`, Prisma CLI přímé `DIRECT_URL`.
- **Důvod:** Pooling omezuje počet připojení ze serverless instancí Vercelu, zatímco přímé připojení je spolehlivější pro migrace.
- **Bezpečnost:** Skutečné connection stringy jsou pouze v ignorovaném `.env` a později v šifrovaných proměnných prostředí Vercelu. Repozitář obsahuje jen zástupné hodnoty v `.env.example`; TLS používá explicitní `sslmode=verify-full`, aby kontrola certifikátu nezávisela na měnící se interpretaci `sslmode=require` v PostgreSQL driveru.

## 2026-10-17 — Import a nekonzistentní data

- **Rozhodnutí:** Import podporuje UTF-8 i Windows-1250, čárku i středník jako oddělovač a datum ve formátu ISO, českém zápisu nebo jako celé sériové číslo Excelu. Neplatná data se neopravují odhadem.
- **Bezpečné normalizace:** rozdíly ve velikosti písmen a oddělovačích kódů (`BOZP_Z` → `BOZP-Z`) a jednoznačný údaj `2 roky` → `24` měsíců. Text útvaru a pozice se pro porovnání převádí na samostatný klíč bez diakritiky; původní zobrazovaná hodnota zůstává zachována.
- **Odmítnuté řádky:** chybějící povinné hodnoty, neplatná data, neznámý zaměstnanec nebo školení, datum konce platnosti před datem absolvování a přesný duplikát termínu se stejným školením, datem, časem a místem. Opakované ID absolvování se uchová pomocí interního klíče, ale import je označí varováním.
- **Platnost:** uchovává se datum platnosti ze zdroje i datum vypočtené z katalogu. Rozdíl se hlásí a nezakrývá přepsáním jedné hodnoty druhou.
- **Budoucí záznamy:** validní řádky po datu exportu se uchovají s varováním. Přehled k 1. 10. 2026 je při výpočtu nebude považovat za již absolvovaná školení.
- **Výsledek kontroly:** přijato 174 z 174 zaměstnanců, 10 z 10 školení, 31 z 34 termínů a 2 842 z 2 868 záznamů o absolvování. Odmítnuté řádky zůstávají dohledatelné podle zdroje, čísla řádku a typu chyby; report nevypisuje jejich osobní obsah.

## 2026-10-17 — Vyhodnocení platnosti

- **Rozhodnutí:** Přehled zahrnuje zaměstnance aktivní k datu exportu. Ukončené pracovní poměry, rodičovská dovolená a budoucí nástupy nejsou v akčním přehledu.
- **Povinnost:** Pravidla pro všechny, útvar a pozici se vyhodnocují jako alternativy; hodnoty útvaru a pozice se porovnávají přes normalizovaný klíč.
- **Platnost:** Použije se poslední absolvování nejpozději k datu exportu a konec platnosti vypočtený podle katalogu. Datum `platnost_do` je včetně. Školení končící během 90 dnů je „brzy končící“, platnost `0` znamená jednorázové školení bez expirace.
- **Důvod:** Jednotný výpočet podle katalogu je reprodukovatelný; nekonzistentní zdrojové datum zůstává zachováno pro audit, ale neřídí stav dashboardu.

## 2026-10-17 — Doporučování termínů

- **Rozhodnutí:** Doporučení bude vysvětlitelné a deterministické, založené na povinnosti školení, naléhavosti, způsobilosti termínu a zbývající kapacitě.
- **Priorita:** Pro brzy končící školení se nejprve rezervuje nejpozdější volné místo ještě před koncem platnosti. Zbylá místa se chronologicky přidělí chybějícím, propadlým a případům, které už před termínem stihnout nelze; v rámci skupiny rozhoduje nejbližší konec platnosti a stabilní řazení zaměstnanců. Použijí se pouze budoucí plánované termíny a záporná volná kapacita se považuje za nulu.
- **Omezení dat:** Export obsahuje jen počet obsazených míst, nikoli seznam přihlášených. Doporučení proto odečítá obsazenost, ale nemůže poznat, zda už konkrétní zaměstnanec přihlášen je; v produkci by bylo nutné napojení na registrační systém.
- **Důvod:** Pro tento problém je auditovatelné pravidlo vhodnější než LLM. Uživatel musí rozumět, proč byl člověk doporučen a proč někdo termín nemá.

## 2026-10-17 — Prezentační vrstva

- **Rozhodnutí:** Výchozí pohled ukazuje pouze chybějící, propadlá a brzy končící školení. Platné záznamy zůstávají dostupné filtrem; tabulka má omezenou výšku, aby byly termíny dosažitelné bez procházení stovek řádků.
- **Kvalita dat:** Varianty názvů útvarů se ve filtru seskupují bez ohledu na diakritiku a velikost písmen. Původní text se v řádku nemění, aby dashboard nezakrýval stav zdroje. Překročení kapacity termínu je zobrazeno jako datový problém, nikoli pouze jako nulová volná kapacita.
- **Bezpečnost:** Databázový přístup je v server-only datové vrstvě. Do interaktivní komponenty se předává explicitní serializovatelné DTO bez zdrojových e-mailů, poznámek, cen, connection stringů a dalších nepotřebných polí.

## 2026-10-17 — Nasazení a provozní kontrola

- **Rozhodnutí:** Vercel build pouze generuje Prisma klienta a sestaví aplikaci; databázové migrace a jednorázový import se spouštějí explicitně z důvěryhodného prostředí.
- **Důvod:** Preview ani opakovaný deployment nesmí automaticky měnit schéma nebo obsah sdílené databáze.
- **Kontrola dostupnosti:** `/api/health` provede minimální dotaz `SELECT 1`, odpověď necachuje a při nedostupné databázi vrátí `503` bez technických detailů. CI používá zástupné connection stringy pouze pro generování klienta a build, k databázi se nepřipojuje.
