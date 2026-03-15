import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIA | Customer Success Engine",
  description: "ARIA — 24/7 AI-powered customer success. Autonomous support across Email, WhatsApp, and Web. Built on Groq, Neon, and Kafka.",
  keywords: ["customer success", "AI support", "ARIA", "intelligent agent", "24/7 assistance", "Groq", "LLM"],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "ARIA | Customer Support Engine",
    description: "24/7 Autonomous AI Customer Support — Email, WhatsApp, Web",
    type: "website",
    siteName: "ARIA by TechCorp",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARIA | Customer Success Engine",
    description: "24/7 AI-powered customer success. Built on Groq llama-3.3-70b.",
  }
};

/**
 * Root Layout for the Customer Success experience
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased min-h-screen bg-bg-1 text-text-primary selection:bg-accent-primary/20 selection:text-accent-primary">
        {children}
      </body>
    </html>
  );
}

