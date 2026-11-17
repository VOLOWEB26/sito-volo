// Completa l'accesso con GitHub e restituisce il token al pannello (Decap CMS).
// Richiede GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET impostate su Cloudflare Pages.
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "")
    .split(";").map((s) => s.trim()).find((s) => s.startsWith("oauth_state="));
  const saved = cookie ? cookie.slice("oauth_state=".length) : null;

  if (!code || !state || state !== saved) {
    return risposta(origin, "error", { message: "Richiesta non valida. Riprova dal pannello." });
  }
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "volo-decap-oauth" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: origin + "/api/callback",
    }),
  });
  const data = await r.json();
  if (!data.access_token) {
    return risposta(origin, "error", { message: data.error_description || "Accesso non riuscito." });
  }
  return risposta(origin, "success", { token: data.access_token, provider: "github" });
}

function risposta(origin, stato, contenuto) {
  const messaggio = "authorization:github:" + stato + ":" + JSON.stringify(contenuto);
  const m = JSON.stringify(messaggio).replace(/</g, "\\u003c");
  const o = JSON.stringify(origin);
  const html = "<!doctype html><html><body><script>(function(){var msg=" + m + ",origin=" + o + ";" +
    "function ricevi(e){if(e.origin!==origin)return;window.opener.postMessage(msg,e.origin);" +
    "window.removeEventListener('message',ricevi,false);}" +
    "window.addEventListener('message',ricevi,false);" +
    "window.opener.postMessage('authorizing:github',origin);})();</script></body></html>";
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0",
    },
  });
}
