export function parseJwt(token: string): { [key: string]: any } {
  try {
    const base64 = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

export function getExpiryFromJwt(token: string): number | null {
  const payload = parseJwt(token);
  const exp = payload?.['exp'];           // <-- bracket access
  return typeof exp === 'number' ? exp * 1000 : null; // ms
}