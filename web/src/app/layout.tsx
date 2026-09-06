import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RenderGuard | Autonomous Film Pipeline Observability",
    template: "%s | RenderGuard",
  },

  description:
    "RenderGuard is an agentic production control room for GPU-based film rendering workloads, combining Gemini, Google ADK, and Grafana MCP for autonomous investigation, policy-guarded remediation, and closed-loop verification.",

  applicationName: "RenderGuard",

  keywords: [
    "RenderGuard",
    "Agentic AI",
    "Film Production",
    "Render Pipeline",
    "GPU Observability",
    "Gemini",
    "Google ADK",
    "Vertex AI",
    "Google Cloud",
    "Grafana Cloud",
    "Grafana MCP",
    "Prometheus",
    "Loki",
    "OpenTelemetry",
    "Autonomous Observability",
    "Closed-Loop Verification",
  ],

  authors: [
    {
      name: "GotiHub",
      url: "https://gotihub.com",
    },
  ],

  creator: "GotiHub",
  publisher: "GotiHub",

  metadataBase: new URL("https://renderguard.gotihub.com"),

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
      { url: "/icon.png", sizes: "1254x1254", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
