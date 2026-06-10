import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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
      <body>
        <Sidebar />
        <div className="main-area">
          <main>{children}</main>
          <footer className="footer">
            © 2025 Tennis Analytics · Data updated daily
          </footer>
        </div>
      </body>
    </html>
  );
}
