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

---

- I am now trying to extend the app to take input via chat or voice using Cloudflare Pages or Realtime. I understand that there are three different types of Realtime (SFU, TURN and Kit) and I understand their differences. Tell me more about how Pages can fit this requirement and more about how I can SFU or TURN. I am not interested in RealtimeKit since it does not have a free tier.

---

- My primary goal is to pass text or voice input so using the MediaRecorder API native to the browser, then using Cloudflare's Whisper AI model to convert it to text and finally have the Llama 3 model return the response sounds like a good solution. However, I would like to learn and use Realtime for gaining some knowledge. How much of a scope creep would it be to use TURN with Realtime SFU to have multiple users join and speak to an AI agent? So that's two features, first and primary one would be the chat/voice input using MediaRecorder, Whisper AI and Llama 3 and the secondary feature would be a feature where a conversation with the AI model can be a meeting room type session for more than one user to join and talk to the AI model.

---

- I would like to tackle the primary feature first. Then, I'd like to look into the audio only chat room and integrate that with the existing primary feature of audio/text input. So let's start implementing the primary feature, step by step with the existing code and infrastrucutre.

---

- Implement text input.

---

- Always separate html in its own file, app.html

---

- Split the AI status and response pane to the right of the page and keep the text and voice input on the left, effectively splitting the screen into two sections. Make the right side with AI status, voice transcript and response wider to accommodate more of the response.

---

- Let's implement history with Durable Objects. Text and voice input/response history.

---

- [ERROR] Could not resolve "cloudflare:workers", src/server.ts:2:30:, 2 │ import { DurableObject } from "cloudflare:workers"; You can mark the path "cloudflare:workers" as external to exclude it from the bundle, which will remove this error and leave the unresolved path in the bundle

---

- An error occurred while extracting routes. Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. Received protocol 'cloudflare:'

---

Load chat history if it exists on initialization of the component instead of starting with empty history.

---

- Let's focus on UI improvements. Make the interface as close as you can to a chatgpt/gemini style interface with auto scroll to latest request response. Chat centered to screen and the recording text input right at the bottom.

---
