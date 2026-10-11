import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

const PROTECTED_ROUTES = ["/dashboard"];

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === "/garden") {
    const destination = new URL("/dashboard", context.url);
    for (const key of ["saved", "error", "tab"]) {
      const value = context.url.searchParams.get(key);
      if (value !== null) destination.searchParams.set(key, value);
    }
    if (destination.searchParams.has("saved") || destination.searchParams.has("error")) {
      destination.searchParams.set("tab", "sectors");
    }
    return context.redirect(`${destination.pathname}${destination.search}`, 308);
  }

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
