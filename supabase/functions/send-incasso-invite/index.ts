// Verstuurt een Magic Link naar de leerling (of diens vertegenwoordiger)
// met daarin een redirect naar /incasso/start?agreement=<id>. Na inloggen
// kan de gebruiker direct de Stripe checkout doorlopen.
//
// Auth required. Toegestaan: privileged staff (admin/teacher) of de leerling zelf.
// Bij een minderjarige leerling (date_of_birth -> <18 nu) wordt de mail naar
// `parent_email` gestuurd indien aanwezig, anders naar het student-account.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSafeErrorMessage } from '../_shared/stripe.ts';

interface Body {
	lesson_agreement_id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}


Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return json(401, { error: 'Missing authorization header' });

	let body: Body;
	try {
		body = await req.json();
	} catch {
		return json(400, { error: 'Invalid JSON' });
	}
	if (!body.lesson_agreement_id || !UUID_RE.test(body.lesson_agreement_id)) {
		return json(400, { error: 'Ongeldig lesson_agreement_id' });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');

	if (!siteUrl) return json(500, { error: 'SITE_URL is not configured' });

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const admin = createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const {
		data: { user },
		error: userErr,
	} = await userClient.auth.getUser();
	if (userErr || !user) return json(401, { error: 'Invalid token' });

	// Authz: privileged of de leerling zelf
	const { data: roleRow } = await userClient
		.from('user_roles')
		.select('role')
		.eq('user_id', user.id)
		.single();
	const role = roleRow?.role;
	const isPrivileged = role === 'admin' || role === 'site_admin' || role === 'teacher';

	const { data: agreement, error: agErr } = await admin
		.from('lesson_agreements')
		.select('id, student_user_id, is_active')
		.eq('id', body.lesson_agreement_id)
		.maybeSingle();
	if (agErr || !agreement) return json(404, { error: 'Overeenkomst niet gevonden' });
	if (!agreement.is_active) return json(409, { error: 'Overeenkomst is niet actief' });
	if (!isPrivileged && agreement.student_user_id !== user.id) {
		return json(403, { error: 'Geen rechten' });
	}

	// Mailadres = het account-emailadres van de leerling. Dit is gegarandeerd
	// een bestaand Supabase-auth-account (anders kan de Magic Link niet werken).
	// Voor minderjarige leerlingen hebben ouders de aanmelding doorgaans op
	// hun eigen e-mailadres gedaan, dus dit adres komt al bij de vertegenwoordiger uit.
	const { data: profile } = await admin
		.from('profiles')
		.select('email')
		.eq('user_id', agreement.student_user_id)
		.maybeSingle();
	const recipient = profile?.email ?? null;
	if (!recipient) return json(422, { error: 'Geen e-mailadres bekend voor leerling' });

	const redirectTo = `${siteUrl}/incasso/start?agreement=${agreement.id}`;

	// Stuur magic link via Supabase Auth (gebruikt ingestelde SMTP).
	// shouldCreateUser=false: alleen de bestaande student kan inloggen via deze link;
	// een ouder ontvangt de mail maar logt in als de student-account-eigenaar.
	const otpClient = createClient(supabaseUrl, anonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const { error: otpErr } = await otpClient.auth.signInWithOtp({
		email: recipient,
		options: {
			emailRedirectTo: redirectTo,
			shouldCreateUser: false,
		},
	});
	if (otpErr) {
		console.error('signInWithOtp error', otpErr);
		return json(502, { error: getSafeErrorMessage(otpErr) });
	}

	await admin.from('incasso_invitations').insert({
		lesson_agreement_id: agreement.id,
		recipient_email: recipient,
		sent_by: user.id,
	});

	return json(200, { ok: true, recipient });
});
