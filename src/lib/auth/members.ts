import "server-only";

/**
 * key -> email for the two pre-provisioned accounts. Server-only so the real
 * addresses never ship in the client bundle. The login chips reference members
 * by `key`/name only (see lib/constants HOUSEHOLD_MEMBERS); the sign-in server
 * action resolves the key to an email here.
 */
export const MEMBER_EMAILS: Record<string, string> = {
  eva: "eva.demsar1@gmail.com",
  nejc: "ne.bevk@gmail.com",
};

export function emailForMember(key: string | null | undefined): string | null {
  if (!key) return null;
  return MEMBER_EMAILS[key] ?? null;
}
