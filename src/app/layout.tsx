import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";

import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";

import "./globals.css";
import "@/components/motion/premium-motion.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const industrialDisplay = Barlow_Condensed({
  variable: "--font-bc-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const industrialMono = IBM_Plex_Mono({
  variable: "--font-bc-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.legalName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: { "tr-TR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: `/favicon.ico?v=${siteConfig.brandIconVersion}`, sizes: "any" },
      { url: `/icons/icon-16.png?v=${siteConfig.brandIconVersion}`, sizes: "16x16", type: "image/png" },
      { url: `/icons/icon-32.png?v=${siteConfig.brandIconVersion}`, sizes: "32x32", type: "image/png" },
      { url: `/icons/icon-48.png?v=${siteConfig.brandIconVersion}`, sizes: "48x48", type: "image/png" },
      { url: `/icon.svg?v=${siteConfig.brandIconVersion}`, type: "image/svg+xml" },
      { url: `/icons/icon-192.png?v=${siteConfig.brandIconVersion}`, sizes: "192x192", type: "image/png" },
      { url: `/icons/icon-512.png?v=${siteConfig.brandIconVersion}`, sizes: "512x512", type: "image/png" },
    ],
    shortcut: `/icons/icon-32.png?v=${siteConfig.brandIconVersion}`,
    apple: [
      {
        url: `/icons/icon-180.png?v=${siteConfig.brandIconVersion}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#070713" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      data-bc-commit={
        process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BC_GIT_COMMIT ?? "local"
      }
      className={`${jakarta.variable} ${bricolage.variable} ${industrialDisplay.variable} ${industrialMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="dns-prefetch" href="https://cdn.thingiverse.com" />
        <link rel="preconnect" href="https://cdn.thingiverse.com" crossOrigin="" />
      </head>
      <body className="min-h-full bg-midnight text-light-text">
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
              logo: `${siteConfig.url}${siteConfig.logo.src}`,
              ...(siteConfig.contact.email
                ? { email: siteConfig.contact.email }
                : {}),
              address: {
                "@type": "PostalAddress",
                addressLocality: siteConfig.city,
                addressCountry: "TR",
              },
              sameAs: Object.values(siteConfig.social).filter(Boolean),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.url,
              inLanguage: "tr-TR",
            },
          ]}
        />
        <a
          href="#ana-icerik"
          className="focus:bg-cobalt focus:text-light-text fixed top-3 left-3 z-[100] -translate-y-24 rounded-md px-4 py-2 text-sm font-semibold transition-transform focus:translate-y-0"
        >
          Ana içeriğe geç
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
