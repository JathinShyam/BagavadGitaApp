// gita.elevenpoint.ca — the web app plus the store pages, served as static
// assets. Code here does two things the asset server can't:
//  1. serve the oversized JS bundle, which the build stores gzipped as
//     `<name>.js.gz` (Workers assets cap at 25 MiB per file);
//  2. map dynamic routes (/verses/2-47) to Expo's exported page for that
//     route (verses/[verseId].html) so deep links load the right screen.

interface Env {
  ASSETS: Fetcher;
}

const DYNAMIC_ROUTES: Record<string, string> = {
  verses: "/verses/[verseId]",
  chapters: "/chapters/[chapterId]",
  paths: "/paths/[pathId]",
  explore: "/explore/[categoryId]",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const dynamic = url.pathname.match(/^\/(verses|chapters|paths|explore)\/[^/]+\/?$/);
    if (dynamic) {
      // The asset server canonicalises `[param]` page URLs with a redirect;
      // follow it here so the browser keeps the real URL (/verses/2-47).
      let page = await env.ASSETS.fetch(new URL(DYNAMIC_ROUTES[dynamic[1]], url));
      for (let hops = 0; hops < 3 && page.status >= 300 && page.status < 400; hops++) {
        const location = page.headers.get("Location");
        if (!location) break;
        page = await env.ASSETS.fetch(new URL(location, url));
      }
      return new Response(page.body, {
        status: page.ok ? 200 : page.status,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }

    if (url.pathname.endsWith(".js")) {
      const gz = await env.ASSETS.fetch(new Request(new URL(url.pathname + ".gz", url), request));
      if (gz.ok) {
        return new Response(gz.body, {
          status: 200,
          encodeBody: "manual",
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Content-Encoding": "gzip",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
