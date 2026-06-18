// Tiny cookie helpers used to persist app state across reloads.

export function getCookie<T>(name: string): T | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(name + '='));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.slice(name.length + 1))) as T;
  } catch {
    return null;
  }
}

export function setCookie(name: string, value: unknown, days = 365): void {
  if (typeof document === 'undefined') return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${exp}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
