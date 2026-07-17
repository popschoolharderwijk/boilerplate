import { corsHeaders } from '../_shared/cors.ts';
import { UUID_RE } from '../_shared/http.ts';

export function bad(message: string, status = 400): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBasicFields(body: {
	lesson_type_id?: string;
	lesson_group_id?: string | null;
	lesson_type_option_id?: string | null;
	first_name?: string;
	last_name?: string;
	email?: string;
}): Response | null {
	if (!body.lesson_type_id || !UUID_RE.test(body.lesson_type_id)) return bad('Ongeldige lessoort');
	if (body.lesson_group_id && !UUID_RE.test(body.lesson_group_id)) return bad('Ongeldige groep');
	if (body.lesson_type_option_id && !UUID_RE.test(body.lesson_type_option_id)) return bad('Ongeldige optie');
	if (!body.first_name?.trim() || !body.last_name?.trim()) return bad('Naam is verplicht');
	if (!body.email || !EMAIL_RE.test(body.email)) return bad('Ongeldig e-mailadres');
	return null;
}
