// keyboard.pdfjet.com: the keyboard page's files from Cloudflare, with the
// headers of the page's .htaccess. Nothing goes on to IONOS (25 November
// 2026): an address the files do not have is a 404 of its own, a POST a 405.

interface Env {
    ASSETS: Fetcher;
}

// .htaccess's: nothing loaded from anywhere but the page itself, nothing
// sent anywhere, and each file asked again on each visit (no-cache), so a
// new version is seen at once. Set on every answer of the files, as
// Apache's "always set"
const HEADERS: Record<string, string> = {
    "Content-Security-Policy":
        "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-cache",
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        if (url.protocol === "http:") {
            return Response.redirect(`https://keyboard.pdfjet.com${url.pathname}${url.search}`, 301);
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
            return withHeaders(new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } }));
        }
        const path = url.pathname === "/" ? "/index.html" : url.pathname;
        const file = await env.ASSETS.fetch(new Request(new URL(path + url.search, url), request));
        if (file.status === 404) {
            return withHeaders(
                new Response(request.method === "HEAD" ? null : "Not found\n", {
                    status: 404,
                    headers: { "Content-Type": "text/plain; charset=utf-8" },
                }),
            );
        }
        return withHeaders(new Response(file.body, file));
    },
} satisfies ExportedHandler<Env>;

// The answer with HEADERS set on it
function withHeaders(response: Response): Response {
    for (const [name, value] of Object.entries(HEADERS)) {
        response.headers.set(name, value);
    }
    return response;
}
