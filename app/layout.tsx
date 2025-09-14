// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cadastro — Igreja Palavra de Vida",
  description: "Atualização de cadastro de membros e familiares",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${jakarta.variable} font-sans min-h-screen text-slate-900 themed-bg antialiased`}>
        {/* camada de “luz” ao centro */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.25]">
          <div className="absolute inset-0 bg-radial from-white via-transparent to-transparent"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
