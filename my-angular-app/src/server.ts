// src/server.ts
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularApp = new AngularAppEngine({
	allowedHosts: ['localhost'],
});

export const reqHandler = createRequestHandler(async (req) => {
	const res = await angularApp.handle(req);
	return res ?? new Response('Page not found.', { status: 404 });
});

// Export it so our outer Cloudflare Worker can import it later
export default { fetch: reqHandler };