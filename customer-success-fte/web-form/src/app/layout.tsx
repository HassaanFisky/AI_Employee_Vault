import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "WHOOSH | AI Operations · Lightning Fast",
  description: "WHOOSH — Lightning Fast AI Customer Success Operations.",
  keywords: ["WHOOSH", "AI operations", "intelligent agent", "lightning fast"],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "WHOOSH | AI Operations",
    description: "Lightning Fast AI Customer Success Operations",
    type: "website",
    siteName: "WHOOSH",
  },
  twitter: {
    card: "summary_large_image",
    title: "WHOOSH | AI Operations",
    description: "Lightning Fast AI Customer Success Operations.",
  },
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
    <html
      lang="en"
      className={`dark scroll-smooth ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased min-h-screen bg-bg-1 text-text-primary selection:bg-accent-primary/20 selection:text-accent-primary font-sans">
        {children}
      </body>
    </html>
  );
}
