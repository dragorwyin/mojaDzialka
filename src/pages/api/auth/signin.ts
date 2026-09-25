import type { APIRoute } from "astro";
import { getSafeReturnTo } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const emailValue = form.get("email");
  const passwordValue = form.get("password");
  const returnTo = getSafeReturnTo(form.get("returnTo"), context.url.origin);

  if (typeof emailValue !== "string" || typeof passwordValue !== "string" || !EMAIL_PATTERN.test(emailValue.trim())) {
    return context.redirect(`/auth/signin?error=signin_failed&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const email = emailValue.trim();
  const password = passwordValue;

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect("/auth/signin?error=auth_unavailable");
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return context.redirect(`/auth/signin?error=signin_failed&returnTo=${encodeURIComponent(returnTo)}`);
  }

  return context.redirect(returnTo);
};
