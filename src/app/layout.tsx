import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import StoreHydrator from "@/components/StoreHydrator";

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

const APP_DESCRIPTION =
  "The job tracker built for international students on F-1 visas. CPT/OPT-aware eligibility checks, auto-discovered SWE jobs, resume-based fit scoring, and pipeline analytics — all private, in your browser.";

export const metadata: Metadata = {
  title: {
    default: "JobPulse — job tracker for international students",
    template: "%s · JobPulse",
  },
  description: APP_DESCRIPTION,
  keywords: [
    "job tracker",
    "international students",
    "F-1 visa",
    "CPT",
    "OPT",
    "new grad",
    "software engineer",
    "internship",
    "co-op",
  ],
  openGraph: {
    title: "JobPulse — job tracker for international students",
    description: APP_DESCRIPTION,
    type: "website",
    siteName: "JobPulse",
  },
  twitter: {
    card: "summary",
    title: "JobPulse — job tracker for international students",
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <StoreHydrator />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 px-6 py-6 lg:px-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
