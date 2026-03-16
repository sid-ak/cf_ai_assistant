/// <reference types="./worker-configuration.d.ts" />
// worker.ts
import { DurableObject } from "cloudflare:workers";

// 1. Import your COMPILED Angular server
// Ensure this path matches the old "main" property in your wrangler.json
import angularServer from "./dist/server/server.mjs";

export interface AppEnv extends Env {
	AI: Ai;
	CHAT_HISTORY: DurableObjectNamespace<ChatHistory>;
}

// 2. The Durable Object Class
export class ChatHistory extends DurableObject {
	async getHistory(): Promise<{role: string, content: string}[]> {
		return (await this.ctx.storage.get('messages')) || [];
	}

	async addMessage(role: string, content: string) {
		const messages = await this.getHistory();
		messages.push({ role, content });
		await this.ctx.storage.put('messages', messages);
		return messages;
	}

	async clear() {
		await this.ctx.storage.delete('messages');
		return [];
	}
}

// 3. The Worker Fetch Handler
export default {
	async fetch(request: Request, env: AppEnv, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Initialize the DO Stub
		const id = env.CHAT_HISTORY.idFromName('global-session');
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
					const transcriptResponse = await env.AI.run('@cf/openai/whisper', { audio: [...new Uint8Array(audioBuffer)] });
					userPrompt = transcriptResponse.text;
				} else {
					const body = await request.json() as { prompt: string };
					userPrompt = body.prompt || 'Hello!';
				}

				await chatStub.addMessage('user', userPrompt);
				const history = await chatStub.getHistory();

				const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages: history });

				await chatStub.addMessage('assistant', aiResponse.response);
				const updatedHistory = await chatStub.getHistory();

				return new Response(JSON.stringify({
					history: updatedHistory,
					transcript: isAudio ? userPrompt : null
				}), { headers: { 'Content-Type': 'application/json' } });

			} catch (error) {
				console.error('AI Request failed:', error);
				return new Response(JSON.stringify({ error: 'AI processing failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}
		}

		// 4. Fallback to Angular SSR for webpages
		return angularServer.fetch(request, env, ctx);
	}
};