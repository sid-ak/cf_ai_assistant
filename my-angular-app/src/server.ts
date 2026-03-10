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

export default {
	async fetch(request: Request, env: AppEnv) {
		const url = new URL(request.url);

		if (url.pathname === '/api/ai' && request.method === 'POST') {
			try {
				const contentType = request.headers.get('content-type') || '';
				let userPrompt = '';
				let isAudio = false;

				if (contentType.includes('multipart/form-data')) {
					isAudio = true;
					const formData = await request.formData();
					const audioFile = formData.get('audio') as File;

					if (!audioFile) {
						return new Response(JSON.stringify({
							error: 'No audio file found'
						}), { status: 400 });
					}

					// Whisper expects an array of numbers (bytes)
					const audioBuffer = await audioFile.arrayBuffer();
					const audioArray = [...new Uint8Array(audioBuffer)];

					// Run Whisper AI to get the transcript
					const transcriptResponse = await env.AI.run('@cf/openai/whisper', {
						audio: audioArray,
					});

					userPrompt = transcriptResponse.text;
				} else {
					// Handle standard text JSON
					const body = await request.json() as { prompt: string };
					userPrompt = body.prompt || 'Hello!';
				}

				// Access the AI binding from the environment
				const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
					prompt: userPrompt
				});

				return new Response(JSON.stringify({
					response: aiResponse.response,
					transcript: isAudio ? userPrompt : null
				}), {
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
		return reqHandler(request);
	}
};
