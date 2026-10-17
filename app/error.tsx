"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Data nejsou dostupná
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          Přehled se nepodařilo načíst
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Zkontrolujte připojení k databázi a zkuste načtení znovu. Zdrojová data
          ani technické podrobnosti chyby se uživateli nezobrazují.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Zkusit znovu
        </button>
      </section>
    </main>
  );
}
