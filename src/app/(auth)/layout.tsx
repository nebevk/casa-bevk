import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/dal";
import { APP_NAME } from "@/lib/constants";

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
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary font-heading text-lg font-semibold text-primary-foreground">
            CB
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your private family hub
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
