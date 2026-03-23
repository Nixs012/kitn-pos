import KitnLogo from "@/components/ui/KitnLogo";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-brand-bg">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <KitnLogo size="xl" />
        
        <h1 className="text-4xl font-bold text-brand-dark mt-4">
          Kenya POS System
        </h1>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="p-4 bg-brand-green text-white rounded-lg shadow-md">brand-green</div>
          <div className="p-4 bg-brand-blue text-white rounded-lg shadow-md">brand-blue</div>
          <div className="p-4 bg-brand-purple text-white rounded-lg shadow-md">brand-purple</div>
          <div className="p-4 bg-brand-coral text-white rounded-lg shadow-md">brand-coral</div>
        </div>

        <p className="text-brand-dark/70 max-w-md text-center">
          Next.js 14 + Tailwind CSS + TypeScript initialization complete with brand identity.
        </p>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
