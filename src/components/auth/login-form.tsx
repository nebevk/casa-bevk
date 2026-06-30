"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type AuthState } from "@/lib/auth/actions";
import { HOUSEHOLD_MEMBERS } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [member, setMember] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(signIn, initialState);

  const memberName = HOUSEHOLD_MEMBERS.find((m) => m.key === member)?.name;
  const t = useT();

  function quickPick(memberKey: string) {
    setMember(memberKey);
    // Focus synchronously, inside the tap gesture, so the keyboard opens
    // (a deferred focus via rAF/timeout loses the user-gesture and won't).
    if (mode === "password") {
      (document.getElementById("password") as HTMLInputElement | null)?.focus();
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="member" value={member ?? ""} />

      {/* Quick-select the two household members (no emails shipped to client) */}
      <div className="grid grid-cols-2 gap-2">
        {HOUSEHOLD_MEMBERS.map((m) => {
          const active = member === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => quickPick(m.key)}
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
                  {m.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{m.name}</span>
            </button>
          );
        })}
      </div>

      {member ? (
        <p className="text-sm text-muted-foreground">
          {t("login.signingInAs", { name: memberName ?? "" })}{" "}
          <button
            type="button"
            onClick={() => setMember(null)}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {t("login.useDifferentEmail")}
          </button>
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("login.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
      )}

      {mode === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">{t("login.password")}</Label>
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
        {mode === "password" ? t("login.signIn") : t("login.sendLink")}
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="block w-full py-2 text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {mode === "password"
          ? t("login.useMagicLink")
          : t("login.usePassword")}
      </button>
    </form>
  );
}
