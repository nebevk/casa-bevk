import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your household.</CardDescription>
      </CardHeader>
      <CardContent>
        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Supabase isn’t connected yet
            </p>
            <p className="mt-1">
              Add your project keys to{" "}
              <code className="rounded bg-muted px-1 py-0.5">.env.local</code>:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs">
              {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
            </pre>
            <p className="mt-2">
              See{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                docs/SUPABASE.md
              </code>{" "}
              to create the project and the two household accounts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
