"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type AuthState } from "@/lib/auth/actions";
import { HOUSEHOLD_MEMBERS } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(signIn, initialState);

  function quickPick(memberEmail: string) {
    setEmail(memberEmail);
    // jump straight to the password field for a fast sign-in
    requestAnimationFrame(() => {
      (document.getElementById("password") as HTMLInputElement | null)?.focus();
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

      {/* Quick-select the two household members */}
      <div className="grid grid-cols-2 gap-2">
        {HOUSEHOLD_MEMBERS.map((member) => {
          const active = email === member.email;
          return (
            <button
              key={member.email}
              type="button"
              onClick={() => quickPick(member.email)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {member.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.name}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@casabevk.home"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
