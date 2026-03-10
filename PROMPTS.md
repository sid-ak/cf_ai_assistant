# Prompts

- I am creating an Angular project with CloudFlare workers. So far I have used CloudFlare's documentation to create an Angular project that can be deployed to CloudFlare's AI workers. However, the project is bare bones and I am attempting to create an Angular service that I can use for Worker bindings, as mentioned in this link. What do you think that Angular service would look like? <https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/>

---

- I followed this guide. <https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/angular/>

---

- Keep the following default wrangler config, don't change it.

```json
{

    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "my-angular-app",
    "main": "./dist/server/server.mjs",
    "compatibility_date": "2026-03-01",
    "assets": {
        "binding": "ASSETS",
        "directory": "./dist/browser"
    },
    "observability": {
        "enabled": true
    },
    "compatibility_flags": [
        "nodejs_compat"
    ],
    "ai": {
        "binding": "AI"
    }
}
```

---

- This is the current server.ts code.

```ts

import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularApp = new AngularAppEngine({
 // It is safe to set allow `localhost`, so that SSR can run in local development,
 // as, in production, Cloudflare will ensure that `localhost` is not the host.
 allowedHosts: ['localhost'],

});

/**
 * This is a request handler used by the Angular CLI (dev-server and during build).
 */

export const reqHandler = createRequestHandler(async (req) => {
 const res = await angularApp.handle(req);
 return res ?? new Response('Page not found.', { status: 404 });
});

export default { fetch: reqHandler };

```

---

- Also take into consideration the following file. Attached worker-configuration.d.ts

---

- `/// <reference types="../worker-configuration.d.ts" />` does not work

---

- Let's move on to creating the service and the component to test that service

---

- The app.ts component is not rendering a response when a response comes back successfully. Use signals.
