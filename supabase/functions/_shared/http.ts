import { corsHeaders } from './cors.ts';

export function jsonResponse(status: number, payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

export function handleCorsPreflight(req: Request): Response | null {
	if (req.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders });
	}
	return null;
}

export function requirePost(req: Request): Response | null {
	if (req.method !== 'POST') {
		return jsonResponse(405, { error: 'Method not allowed' });
	}
	return null;
}
