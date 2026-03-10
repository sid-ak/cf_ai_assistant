import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

// 1. Define your Cloudflare environment bindings
export interface AppEnv extends Env {
	AI: Ai;
}

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

// 2. Export a custom fetch handler for Cloudflare
export default {
	async fetch(request: Request, env: AppEnv) {
		const url = new URL(request.url);

		// 3. Intercept the AI API request BEFORE it hits Angular
		if (url.pathname === '/api/ai' && request.method === 'POST') {
			try {
				const body = await request.json() as { prompt: string };
				const userPrompt = body.prompt || 'Hello!';

				// Access the AI binding from the environment
				const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
					prompt: userPrompt,
				});

				return new Response(JSON.stringify(aiResponse), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('AI Request failed:', error);
				return new Response(JSON.stringify({ error: 'AI processing failed' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// 4. Fallback to Angular's SSR handler for all other routes (like webpages)
		return reqHandler(request);
	}
};