import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Şifremi unuttum",
  description: `${siteConfig.name} hesabınız için şifre sıfırlama bağlantısı isteyin.`,
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm configured={isSupabaseConfigured} />;
}
