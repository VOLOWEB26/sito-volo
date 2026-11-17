// Avvia l'accesso con GitHub per il pannello di gestione (Decap CMS).
// Richiede la variabile GITHUB_CLIENT_ID impostata su Cloudflare Pages.
export async function onRequest({ request, env }) {
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", origin + "/api/callback");
  url.searchParams.set("scope", "repo,user");
  url.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": "oauth_state=" + state + "; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600",
    },
  });
}
