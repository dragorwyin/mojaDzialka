import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const emailValue = form.get("email");
  const passwordValue = form.get("password");
  const confirmPasswordValue = form.get("confirmPassword");

  if (typeof emailValue !== "string" || typeof passwordValue !== "string" || typeof confirmPasswordValue !== "string") {
    return context.redirect("/auth/signup?error=invalid_input");
  }

  const email = emailValue.trim();
  const password = passwordValue;
  if (!email || !EMAIL_PATTERN.test(email)) {
    return context.redirect("/auth/signup?error=invalid_input");
  }
  if (password.length < 8) {
    return context.redirect("/auth/signup?error=password_too_short");
  }
  if (password !== confirmPasswordValue) {
    return context.redirect("/auth/signup?error=password_mismatch");
  }

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect("/auth/signup?error=auth_unavailable");
  }
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return context.redirect("/auth/signup?error=signup_failed");
  }

  return context.redirect("/dashboard");
};
