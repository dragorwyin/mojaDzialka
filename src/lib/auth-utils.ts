export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Sprawdź adres e-mail i hasło.",
  password_too_short: "Hasło musi mieć co najmniej 8 znaków.",
  password_mismatch: "Hasła nie są takie same.",
  signup_failed: "Nie udało się utworzyć konta. Spróbuj ponownie.",
  signin_failed: "Adres e-mail lub hasło są nieprawidłowe.",
  auth_unavailable: "Logowanie jest chwilowo niedostępne. Spróbuj ponownie później.",
};

const GENERIC_AUTH_ERROR = "Coś poszło nie tak. Spróbuj ponownie.";

export function getAuthErrorMessage(code: string | null): string | null {
  if (code === null) return null;
  return Object.prototype.hasOwnProperty.call(AUTH_ERROR_MESSAGES, code)
    ? AUTH_ERROR_MESSAGES[code]
    : GENERIC_AUTH_ERROR;
}

export function getSafeReturnTo(value: FormDataEntryValue | null | undefined, origin: string): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  try {
    const target = new URL(value, origin);
    if (target.origin !== new URL(origin).origin) return "/dashboard";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/dashboard";
  }
}
