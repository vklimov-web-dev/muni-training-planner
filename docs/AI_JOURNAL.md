# Stručný záznam o použití AI

Použitý nástroj: OpenAI Codex. AI slouží jako pomocník pro analýzu, implementaci a kontrolu; za výsledná rozhodnutí a ověření odpovídá autor řešení.

## 2026-10-17

### K čemu byla AI použita

- prvotní kontrola struktury a kvality čtyř CSV exportů;
- formulace MVP, vědomých omezení a plánu logických commitů;
- porovnání variant nasazení a serverové architektury;
- vytvoření základní kostry Next.js aplikace, testu a health endpointu;
- spuštění kontrol typů, lintování, testů, produkčního buildu a lokálního smoke testu.

### Co bylo nutné opravit nebo zpochybnit

- První návrh byl statický React/Vite frontend na Netlify. Po kritickém posouzení požadavků na SQL, provoz a zacházení s citlivými daty byl návrh změněn na serverovou aplikaci s PostgreSQL.
- Po rozhodnutí použít Vercel byla architektura zjednodušena na Next.js App Router a serverové dotazy přes Prisma. Původní Netlify Functions proto byly odstraněny.
- Automaticky zvolená novější verze TypeScriptu zbytečně zvyšovala riziko kompatibility. Verze byla připnuta na podporovaný TypeScript 5.9; experimentální cesta Next.js přes TypeScript CLI byla vypnuta a build byl znovu ověřen přes standardní compiler API.
- Turbopack build v omezeném vývojovém prostředí nemohl vytvořit pomocný lokální proces. Pro reprodukovatelnou kontrolu je proto build spuštěn přes podporovaný webpack bundler.
- Původní volba pnpm neměla pro jednu malou aplikaci dostatečný přínos. Po zpochybnění tohoto rozhodnutí byl projekt převeden na standardní npm a `package-lock.json`.
- První npm audit odhalil zranitelný tranzitivní glob parser v `eslint-config-next`. Navržený automatický fix by provedl nevhodný downgrade. Preset byl proto nahrazen přímými ESLint, TypeScript a React Hooks pravidly; následná čistá instalace hlásila 0 zranitelností.

### Jak byl výstup ověřen

- `npm run check`: TypeScript, ESLint, Vitest a produkční Next.js build;
- smoke test hlavní stránky a odpovědi `/api/health` na lokálním production serveru;
- kontrola staged souborů a potvrzení, že zdrojové CSV ani build artefakty nejsou součástí commitu.

### Datový model a import

- AI pomohla navrhnout normalizovaný PostgreSQL model, parser čtyř rozdílných exportů a testy hraničních případů.
- První analytický skript chybně předpokládal číselnou platnost v měsících a skončil na hodnotě `2 roky`. Import byl upraven tak, aby tuto jednoznačnou hodnotu normalizoval na 24 měsíců a změnu zaznamenal.
- První kontrola dat považovala většinu dat absolvování za chybnou, protože ověřovala pouze ISO formát. Po kontrole zdroje byly explicitně doplněny české formáty a sériová data Excelu; neexistující datum `31. 9. 2026` naopak zůstává odmítnuté.
- Bylo zpochybněno automatické přepisování konce platnosti podle katalogu. Datový model proto uchovává zvlášť hodnotu ze zdroje a vypočtenou hodnotu a neshody pouze hlásí.
- Prisma CLI schéma správně validovalo a vygenerovalo klienta, ale `migrate diff` v pracovním prostředí nevytvořil SQL ani chybu. Po kontrole výstupu byla počáteční migrace zapsána explicitně a doplněna o databázová omezení.
- CLI `tsx` v omezeném prostředí selhal při vytvoření IPC socketu. Projektové skripty proto používají oficiální Node import hook `node --import tsx`, který stejný kód spustil bez pomocného procesu.

### Ověření importu

- unit testy pokrývají ISO a česká data, sériové datum Excelu, neplatný kalendářní den, normalizaci kódů, Windows-1250, minimalizaci osobních dat, neznámé vazby, překročenou kapacitu a budoucí záznam;
- `npm run data:check` načte všechny čtyři reálné exporty bez zápisu do databáze a vypíše pouze agregovaný report;
- přijaté a odmítnuté počty byly porovnány s nezávislou jednorázovou analýzou zdrojových souborů.
- Původní konfigurace používala pooled URL také pro migrace a importní skript nenačetl lokální `.env`. Po ověření proti skutečné Neon databázi byla migrace přepnuta na přímé `DIRECT_URL`, import explicitně načítá prostředí a obě cesty byly prakticky spuštěny.
- Při přípravě doporučení AI nejprve započítala dva řádky se stejným školením, datem, časem a místem jako dva samostatné termíny. Kontrola zdrojových řádků odhalila riziko falešné kapacity; přesný duplikát se nyní odmítá a pravidlo je pokryto testem.
- Stav a doporučení se neodvozují pomocí LLM. AI pomohla implementovat deterministická pravidla, která byla zpřesněna o pevné datum exportu, 90denní horizont, ignorování budoucích absolvování, zbývající kapacitu a omezení chybějícího seznamu přihlášených.

### Dashboard

- AI pomohla vytvořit serverově načítaný dashboard, interaktivní filtry, stavy načítání a chyby a komponentové testy.
- První verze filtru útvarů přímo zobrazila všechny textové varianty ze zdroje (`Správa budov`, `správa budov`, `SPRÁVA BUDOV`). Při kontrole v prohlížeči byl tento výstup zpochybněn: filtr nyní varianty seskupuje, ale tabulka dál ukazuje původní hodnotu kvůli transparentnosti.
- První verze označila termíny s obsazeností nad kapacitou jen jako „bez volných míst“. To skrývalo datový problém; po vizuální kontrole dashboard výslovně ukazuje překročení kapacity.
- AI následně definovala filtr „Bez volných míst“ příliš úzce: zahrnul pouze přesně naplněné termíny a vyloučil například stav `31/30`. Autor na chybu upozornil; nejprve ji reprodukoval nový regresní test a podmínka byla opravena na `obsazeno >= kapacita`. Samostatný filtr „Překročená kapacita“ zůstává užší (`obsazeno > kapacita`).
- Výstup byl ověřen komponentovými testy, typovou kontrolou, lintováním a ruční kontrolou stránky nad skutečně importovanými daty v desktopovém i úzkém rozložení.
- Lokální server upozornil na budoucí oslabení významu `sslmode=require` v PostgreSQL driveru. Místo ignorování upozornění byly vzorové i lokální Neon URL přepnuty na explicitní `sslmode=verify-full`; tajné hodnoty zůstaly mimo výstupy a Git.
- Při lokální kontrole AI chybně spustila produkční build souběžně s vývojovým serverem a poté přepnula vývojový bundler. Tím zanechala nekonzistentní generovaný obsah v `.next/dev` a následující spuštění Turbopacku skončilo interní chybou. Kontrola panic logu, časů souborů a Git stavu potvrdila, že zdrojové změny zůstaly nedotčené; pro další ověřování se build a dev server nespouštějí souběžně a při změně bundleru se zahazuje pouze generovaný cache.
- Při přípravě nasazení byl původní statický health endpoint zpochybněn: vracel `ok`, i když databáze nemusela být dostupná. Byl nahrazen minimálním databázovým dotazem, chybovým stavem `503` bez detailů a regresními testy pro obě větve.

Záznam bude doplňován jen při podstatném použití AI, změně rozhodnutí nebo opravě jejího výstupu; nebude obsahovat kompletní historii konverzace.
