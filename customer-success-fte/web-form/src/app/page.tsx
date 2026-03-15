// web-form/src/app/page.tsx
// Demo page that embeds the SupportWidget
import { SupportWidget } from "@/components/SupportWidget";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0f0f13 0%,#1a1028 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Demo landing content */}
      <div style={{ textAlign: "center", marginBottom: "40px", position: "absolute", top: "10%" }}>
        <h1
          style={{
            fontSize: "clamp(2rem,5vw,3.5rem)",
            fontWeight: 700,
            background: "linear-gradient(135deg,#818cf8,#6366f1,#a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "12px",
          }}
        >
          Customer Success AI
        </h1>
        <p style={{ color: "#9898b0", fontSize: "1.1rem" }}>
          Your 24/7 intelligent support assistant — powered by ARIA
        </p>
      </div>

      {/* Embeddable widget */}
      <SupportWidget />
    </main>
  );
}
