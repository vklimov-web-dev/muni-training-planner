export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-full max-w-xl rounded bg-slate-200" />
        <div className="mt-3 h-5 w-full max-w-2xl rounded bg-slate-200" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="mt-12 h-96 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
