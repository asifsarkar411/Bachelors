import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeveloperPopup from "@/components/DeveloperPopup";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Bachelor Flat - Meal Management System",
  description:
    "Complete meal count, expense tracking, and flat management system for bachelor flats. Track meals, bajar, cash collections, and flat expenses effortlessly.",
  keywords: "bachelor flat, meal management, expense tracker, meal count",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="night">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍛</text></svg>" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <DeveloperPopup />
      </body>
    </html>
  );
}
