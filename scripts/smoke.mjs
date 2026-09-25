// Smoke test: proves the built app, the Cloudflare adapter and the Supabase auth flow still work together.
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(response) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired) jar.delete(name.trim());
    else jar.set(name.trim(), rest.join("="));
  }
}

async function request(path, { method = "GET", form } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(),
      Origin: BASE_URL,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  storeCookies(response);
  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    body: await response.text(),
  };
}

const steps = [
  ["home renders", () => request("/"), { status: 200 }],
  [
    "dashboard preserves requested path for anonymous user",
    () => request("/dashboard"),
    { status: 302, location: "/auth/signin?returnTo=%2Fdashboard" },
  ],
  [
    "signup rejects passwords shorter than eight characters",
    () => request("/api/auth/signup", { method: "POST", form: { email, password: "short", confirmPassword: "short" } }),
    { status: 302, location: "/auth/signup?error=password_too_short" },
  ],
  [
    "signup creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password, confirmPassword: password } }),
    { status: 302, location: "/dashboard" },
  ],
  ["signup establishes dashboard session", () => request("/dashboard"), { status: 200 }],
  ["signout clears session", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  [
    "dashboard redirects after signout and preserves target",
    () => request("/dashboard"),
    { status: 302, location: "/auth/signin?returnTo=%2Fdashboard" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong", returnTo: "/dashboard" } }),
    { status: 302, location: "/auth/signin?error=signin_failed&returnTo=%2Fdashboard" },
  ],
  [
    "wrong-password error displays a generic signin message",
    () => request("/auth/signin?error=signin_failed&returnTo=%2Fdashboard"),
    { status: 200, includes: "Email or password is incorrect.", excludes: "signin_failed" },
  ],
  [
    "signin accepts correct password and returns to requested dashboard",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "/dashboard" } }),
    { status: 302, location: "/dashboard" },
  ],
  ["dashboard renders for signed-in user", () => request("/dashboard"), { status: 200 }],
  [
    "signout clears session before default signin",
    () => request("/api/auth/signout", { method: "POST" }),
    { status: 302, location: "/" },
  ],
  [
    "signin without returnTo defaults to dashboard",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/dashboard" },
  ],
  ["dashboard renders after default signin", () => request("/dashboard"), { status: 200 }],
  [
    "signin rejects an external returnTo",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "https://example.com" } }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "signin rejects a protocol-relative returnTo",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "//example.com" } }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "signin rejects a backslash returnTo",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "/\\\\example.com" } }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "unknown signin error displays only generic message",
    () => request("/auth/signin?error=supabase-secret-sentinel"),
    { status: 200, includes: "Something went wrong. Please try again.", excludes: "supabase-secret-sentinel" },
  ],
  [
    "unknown signup error displays only generic message",
    () => request("/auth/signup?error=supabase-secret-sentinel"),
    { status: 200, includes: "Something went wrong. Please try again.", excludes: "supabase-secret-sentinel" },
  ],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined || actual.location.startsWith(expected.location)) &&
    (expected.includes === undefined || actual.body.includes(expected.includes)) &&
    (expected.excludes === undefined || !actual.body.includes(expected.excludes));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(`      expected ${expected.status} ${expected.location ?? ""}`);
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
