import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/dal";
import { LogoImage } from "@/components/brand-mark";
import { VineArt } from "@/components/cozy";
import { I18nProvider } from "@/lib/i18n/provider";
import { getMessages } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translate";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();
  if (user) redirect("/dashboard");
  const { locale, messages } = await getMessages();

  return (
    <I18nProvider locale={locale} messages={messages}>
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-3 inline-flex rounded-2xl p-2.5"
            style={{
              backgroundImage:
                "linear-gradient(150deg, #5d7551 0%, #41553c 52%, #2c402a 100%)",
            }}
          >
            <LogoImage size={120} />
          </div>
          <div className="font-brand inline-block text-left text-[2.75rem] leading-[0.85] text-primary">
            <div>Casa</div>
            <div className="pl-10">Bevk</div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {translate(messages, "login.tagline")}
          </p>
          <div className="mx-auto mt-4 w-44 text-primary/25">
            <VineArt className="h-6 w-full" />
          </div>
        </div>
        {children}
      </div>
    </main>
    </I18nProvider>
  );
}
