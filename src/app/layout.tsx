import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  IBM_Plex_Mono,
  Manrope,
  Noto_Sans_Arabic,
} from "next/font/google";

import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { localeMeta } from "@/i18n/config";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

import "./globals.css";
import "@/components/motion/premium-motion.css";

const jakarta = Manrope({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
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
    languages: { "tr-TR": "/", "en": "/en", "ar": "/ar" },
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
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#050403" },
  ],
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const meta = localeMeta[locale];
  return (
    <html
      lang={meta.html}
      dir={meta.dir}
      data-bc-commit={
        process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BC_GIT_COMMIT ?? "local"
      }
      className={`${jakarta.variable} ${display.variable} ${mono.variable} ${arabic.variable} h-full antialiased`}
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
              inLanguage: meta.html,
            },
          ]}
        />
        <a
          href="#ana-icerik"
          className="focus:bg-cobalt focus:text-light-text fixed top-3 left-3 z-[100] -translate-y-24 rounded-md px-4 py-2 text-sm font-semibold transition-transform focus:translate-y-0"
        >
          {msg(messages, "skip")}
        </a>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
