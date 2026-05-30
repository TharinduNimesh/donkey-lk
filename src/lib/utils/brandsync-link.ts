export function createBrandSyncToken() {
  const value = crypto.randomUUID().replace(/-/g, "");
  const encoded = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of encoded) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeBrandSyncToken(token: string) {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function createBrandSyncLink(token: string) {
  return `/go/${token}`;
}

export function buildBrandSyncUrl(origin: string, token: string) {
  return new URL(createBrandSyncLink(token), origin).toString();
}