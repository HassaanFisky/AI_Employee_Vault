export const typography = {
  fontFamily: {
    jakarta: "var(--font-jakarta)",
    jetbrains: "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  fontSize: {
    "body-sm": ["11px", { lineHeight: "16px", fontWeight: "500" }],
    "body-reg": ["13px", { lineHeight: "20px", fontWeight: "400" }],
    "body-lg": ["16px", { lineHeight: "24px", fontWeight: "500" }],
    "body-mono": ["12px", { lineHeight: "18px", fontWeight: "400" }],
    h1: ["36px", { lineHeight: "44px", fontWeight: "800", letterSpacing: "-0.02em" }],
    h2: ["24px", { lineHeight: "32px", fontWeight: "700", letterSpacing: "-0.01em" }],
    h3: ["18px", { lineHeight: "26px", fontWeight: "600" }],
  } as Record<string, [string, { lineHeight: string; fontWeight: string; letterSpacing?: string }]>,
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
};
