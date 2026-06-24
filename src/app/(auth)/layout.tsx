import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/dal";
import { LogoImage } from "@/components/brand-mark";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-2xl bg-[#41553c] p-2.5">
            <LogoImage size={120} />
          </div>
          <div className="font-brand inline-block text-left text-[2.75rem] leading-[0.85] text-primary">
            <div>Casa</div>
            <div className="pl-10">Bevk</div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Your private family hub
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
