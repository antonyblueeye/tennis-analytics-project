import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Tennis Analytics — Player Stats & Rankings",
  description: "Search and analyse 50,000+ professional tennis players. Stats, rankings, and match history spanning 60 years.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <footer className="footer">
          © 2025 Tennis Analytics · Data updated daily
        </footer>
      </body>
    </html>
  );
}
