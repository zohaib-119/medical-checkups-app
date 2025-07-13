import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/providers/Providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MedCheckup",
  description: "Your one-stop solution for medical checkups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
        <main>
          <Header />
          <div className="min-h-[80vh] bg-gray-50">
            {children}
            <Toaster richColors />
          </div>
          {/* <Footer /> */}
        </main>
        </Providers>
      </body>
    </html>
  );
}
