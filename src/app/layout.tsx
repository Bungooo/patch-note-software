import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { BrandHeader } from "@/components/brand-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ianord Patch Notes",
  description: "Logiciel de gestion de notes de mises à jour",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased font-sans`}
        style={{ backgroundColor: "var(--background-color)" }}
      >
        <div className="print:hidden">
          <BrandHeader />
        </div>
        <main className="min-h-screen w-full px-4 lg:w-[70%] lg:px-0 mx-auto grid grid-cols-12 gap-8 print:block print:w-full print:max-w-none print:px-0">
          <div className="col-span-12 print:max-w-none">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
