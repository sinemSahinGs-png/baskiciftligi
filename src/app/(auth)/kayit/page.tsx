import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Hesap oluştur",
  description: `${siteConfig.name} müşteri hesabınızı oluşturun.`,
};

export default function RegisterPage() {
  return <AuthForm mode="register" configured={isSupabaseConfigured} />;
}
