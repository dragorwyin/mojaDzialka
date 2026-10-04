import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

const PROTECTED_ROUTES = ["/dashboard", "/garden"];

export const onRequest = defineMiddleware(async (context, next) => {
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => context.url.pathname.startsWith(route));

  if (!isProtectedRoute) {
    context.locals.user = null;
    return next();
  }

  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  if (!context.locals.user) {
    const signInUrl = new URL("/auth/signin", context.url);
    signInUrl.searchParams.set("returnTo", `${context.url.pathname}${context.url.search}`);
    return context.redirect(`${signInUrl.pathname}${signInUrl.search}`);
  }

  return next();
});
