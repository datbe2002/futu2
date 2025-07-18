import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Future App",
  description: "Future App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${beVietnamPro.variable} antialiased`}>{children}</body>
      <footer className="text-center text-md font-bold text-white py-4">
        Made by CZ with ❤️
      </footer>
    </html>
  );
}
