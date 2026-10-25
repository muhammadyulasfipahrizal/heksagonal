import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
// import "svgmap/dist/svg-map.css";
import SessionProvider from "@/utils/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/Providers";
import SessionTimeoutWrapper from "@/components/SessionTimeoutWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = "https://heksagonal.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HEKSAGONAL - Marketplace",
    template: "%s | HEKSAGONAL",
  },
  description:
    "Temukan berbagai produk pilihan di marketplace HEKSAGONAL.",
  applicationName: "HEKSAGONAL",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "HEKSAGONAL",
    title: "HEKSAGONAL - Marketplace",
    description:
      "Temukan berbagai produk pilihan di marketplace HEKSAGONAL.",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  return (
    <html lang="en" data-theme="light">
      <body className={poppins.className}>
        <SessionProvider session={session}>
          <SessionTimeoutWrapper />
          <Header />
          <Providers>
            {children}
          </Providers>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
