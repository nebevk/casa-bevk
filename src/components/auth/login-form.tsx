"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@casabevk.home"
          required
        />
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="text-sm text-primary" role="status">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {mode === "password" ? "Sign in" : "Email me a sign-in link"}
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {mode === "password"
          ? "Email me a magic link instead"
          : "Use a password instead"}
      </button>
    </form>
  );
}
