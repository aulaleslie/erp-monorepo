"use client";

import { NextIntlClientProvider } from "next-intl";
import { useMemo } from "react";
import { Locale, DEFAULT_LOCALE } from "@gym-monorepo/shared";
import { useAuth } from "@/contexts/AuthContext";
import { en, id } from "@/locales/locales";

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  [Locale.EN]: en,
  [Locale.ID]: id,
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { activeTenant } = useAuth();

  const locale: Locale = useMemo(
    () => activeTenant?.language ?? DEFAULT_LOCALE,
    [activeTenant?.language],
  );

  const messages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={process.env.NEXT_PUBLIC_DEFAULT_TIME_ZONE ?? "Asia/Jakarta"}
      onError={(error) => {
        console.error("LocaleProvider", error);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}