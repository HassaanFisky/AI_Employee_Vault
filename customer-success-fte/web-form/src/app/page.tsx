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
      <div className="absolute top-6 right-8 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-bg-2 border border-white/5 hover:border-accent-primary/50 text-body-sm font-bold text-text-quaternary hover:text-accent-primary transition-all shadow-xl backdrop-blur-md uppercase tracking-widest"
        >
          Initialize Command Center
        </Link>
      </div>

      {/* Search Console / Main Interaction Area */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <SupportForm />
      </div>

      {/* Floating Support Experience */}
      <SupportWidget />

      {/* Footer Branding */}
      <footer className="mt-24 py-12 border-t border-white/5 w-full max-w-[600px] flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <span className="w-12 h-px bg-white/5" />
          <p className="text-[10px] text-text-quaternary font-bold tracking-[0.3em] uppercase">
            Engineered by WHOOSH Teams
          </p>
          <span className="w-12 h-px bg-white/5" />
        </div>
        <p className="text-[11px] text-text-quaternary font-medium uppercase tracking-widest opacity-40">
          © {new Date().getFullYear()} WHOOSH · AI Operations · Lightning Fast
        </p>
      </footer>
    </main>
  );
}

