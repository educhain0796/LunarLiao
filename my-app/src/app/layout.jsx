import localFont from "next/font/local";
import "./globals.css";
import { Providers } from './Providers';
import NavbarClient from './component/NavbarClient';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Lunar Liao - Blockchain Astrology",
  description: "Connect with astrology enthusiasts and explore the endless possibilities of blockchain technology",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <NavbarClient />
          {children}
        </Providers>
      </body>
    </html>
  );
}
