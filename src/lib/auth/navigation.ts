export function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function buildAuthRedirectPath(path: string) {
  return encodeURIComponent(normalizeNextPath(path));
}
