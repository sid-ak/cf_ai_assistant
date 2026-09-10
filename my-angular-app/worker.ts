/// <reference types="./worker-configuration.d.ts" />
// worker.ts
import { DurableObject } from "cloudflare:workers";

// 1. Import Angular server
// @ts-ignore
import angularServer from "./dist/server/server.mjs";

// 2. The Durable Object Class
export class ChatHistory extends DurableObject {
	async getHistory(): Promise<{role: string, content: string}[]> {
		return (await this.ctx.storage.get('messages')) || [];
	}

	async addMessage(role: string, content: string | undefined) {
		if (!content) return [];
		const messages = await this.getHistory();
		messages.push({ role, content });
		await this.ctx.storage.put('messages', messages);
		const ONE_DAY_MS = 24 * 60 * 60 * 1000;
		await this.ctx.storage.setAlarm(Date.now() + ONE_DAY_MS);
		return messages;
	}

	async clear() {
		await this.ctx.storage.delete('messages');
		return [];
	}

	override async alarm() {
		console.log('Inactive for one day, deleting chat history.');
		await this.ctx.storage.deleteAll();
	}
}

// 3. The Worker Fetch Handler
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
        const sessionId = request.headers.get('x-session-id') || 'default-session';
        const id = env.CHAT_HISTORY.idFromName(sessionId);
        const chatStub = env.CHAT_HISTORY.get(id);

		// Handle Clear History API
		if (url.pathname === '/api/ai/history' && request.method === 'DELETE') {
			await chatStub.clear();
			return new Response(JSON.stringify({ success: true }));
		}

		if (url.pathname === '/api/ai/history' && request.method === 'GET') {
			const history = await chatStub.getHistory();
			return new Response(JSON.stringify({ history }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Handle AI Prompt API
		if (url.pathname === '/api/ai' && request.method === 'POST') {
			try {
				const contentType = request.headers.get('content-type') || '';
				let userPrompt = '';
				let isAudio = false;

				if (contentType.includes('multipart/form-data')) {
					isAudio = true;
					const formData = await request.formData();
					const audioFile = formData.get('audio') as File;
					if (!audioFile) return new Response(JSON.stringify({ error: 'No audio file found' }), { status: 400 });

					const audioBuffer = await audioFile.arrayBuffer();
					const transcriptResponse = await env.AI.run('@cf/openai/whisper', {
						audio: [...new Uint8Array(audioBuffer)]
					});

					userPrompt = transcriptResponse.text;
				} else {
					const body = await request.json() as { prompt: string };
					userPrompt = body.prompt || 'Hello!';
				}

				await chatStub.addMessage('user', userPrompt);
				const history = await chatStub.getHistory();

				const model = (env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fast') as keyof AiModels;
				const maxTokens = Number(env.AI_MAX_TOKENS) || 2048;
				const aiResponse = await env.AI.run(model, { messages: history, max_tokens: maxTokens }) as { response?: string };

				await chatStub.addMessage('assistant', aiResponse.response?.trim());
				const updatedHistory = await chatStub.getHistory();

				return new Response(JSON.stringify({
					history: updatedHistory,
					transcript: isAudio ? userPrompt : null
				}), { headers: { 'Content-Type': 'application/json' } });

			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error('AI Request failed:', message);
				return new Response(JSON.stringify({ error: 'AI processing failed', message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}
		}

		// 4. Fallback to Angular SSR for webpages
		return angularServer.fetch(request, env, ctx);
	}
};