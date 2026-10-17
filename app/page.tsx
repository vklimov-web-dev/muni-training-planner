const SNAPSHOT_DATE_LABEL = "1. 10. 2026";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Vzorová instituce
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Přehled povinných školení
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Aplikace připraví přehled platnosti školení a doporučí zaměstnance na
            dostupné termíny podle naléhavosti a kapacity.
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-100 p-5">
              <dt className="text-sm font-medium text-slate-600">Stav dat k</dt>
              <dd className="mt-1 text-xl font-semibold">{SNAPSHOT_DATE_LABEL}</dd>
            </div>
            <div className="rounded-xl border border-dashed border-slate-300 p-5">
              <dt className="text-sm font-medium text-slate-600">Aktuální krok</dt>
              <dd className="mt-1 text-base font-semibold">
                Připravujeme bezpečný import dat.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
