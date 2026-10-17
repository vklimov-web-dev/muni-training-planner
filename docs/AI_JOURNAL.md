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

Záznam bude doplňován jen při podstatném použití AI, změně rozhodnutí nebo opravě jejího výstupu; nebude obsahovat kompletní historii konverzace.
