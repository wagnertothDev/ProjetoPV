// lib/isAdmin.ts
export function isAdmin(email?: string | null) {
  if (!email) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
