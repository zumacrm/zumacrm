import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZUMA CRM - Plataforma SaaS de Gestión y Turnos",
  description: "Portal administrativo integral para profesionales y empresas asociadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased text-slate-800 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
