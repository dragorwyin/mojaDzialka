export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Enter a valid email and password.",
  password_too_short: "Password must be at least 8 characters.",
  password_mismatch: "Passwords do not match.",
  signup_failed: "Could not create your account. Please try again.",
  signin_failed: "Email or password is incorrect.",
  auth_unavailable: "Authentication is temporarily unavailable. Please try again later.",
};

const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";

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
