import dynamic from "next/dynamic";
import Link from "next/link";
import { SupportForm } from "@/components";

/**
 * Premium Support Widget - Lazy loaded
 */
const SupportWidget = dynamic(
  () => import("@/components/SupportWidget").then((mod) => mod.SupportWidget),
  { ssr: false }
);

/**
 * Customer Success AI Home Page
 * premium, zero-friction entry point for support
 */
export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-bg-1 text-text-primary flex flex-col items-center justify-start py-3xl px-md overflow-x-hidden scrollbar-premium">
      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-accent-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Admin Dashboard Link */}
      <div className="absolute top-6 right-6 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-2 border border-bg-3 hover:border-accent-primary/50 text-body-sm font-semibold text-text-secondary hover:text-accent-primary transition-all shadow-sm"
        >
          Admin Dashboard
        </Link>
      </div>

      {/* Search Console / Main Interaction Area */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <SupportForm />
      </div>

      {/* Floating Support Experience */}
      <SupportWidget />

      {/* Footer Branding */}
      <footer className="mt-3xl py-xl border-t border-bg-3 w-full max-w-[600px] flex flex-col items-center gap-sm">
        <div className="flex items-center gap-md">
          <span className="w-md h-[1px] bg-bg-3" />
          <p className="text-body-sm text-text-tertiary font-medium tracking-widest uppercase">
            Powered by TechCorp Systems
          </p>
          <span className="w-md h-[1px] bg-bg-3" />
        </div>
        <p className="text-body-sm text-text-tertiary opacity-60">
          © {new Date().getFullYear()} Enterprise Grade AI · Customer Success Division
        </p>
      </footer>
    </main>
  );
}

