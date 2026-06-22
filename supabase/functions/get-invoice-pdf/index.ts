// Returns a short-lived signed URL for an invoice PDF.
// RLS enforced via user JWT — students can only fetch their own invoice.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { beginAuthenticatedPostRequest, jsonResponse } from '../_shared/http.ts';

interface Body {
	invoice_id: string;
}

Deno.serve(async (req) => {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body } = begun;
	if (!body.invoice_id) return jsonResponse(400, { error: 'invoice_id vereist' });

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
	// RLS-checked: returns 0 rows if the user isn't allowed to see it.
	const { data: inv, error } = await userClient
		.from('invoices')
		.select('id, invoice_number, pdf_storage_path')
		.eq('id', body.invoice_id)
		.maybeSingle();
	if (error || !inv || !inv.pdf_storage_path) return jsonResponse(404, { error: 'Factuur niet beschikbaar' });

	const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
	const { data, error: sErr } = await admin.storage.from('invoices').createSignedUrl(inv.pdf_storage_path, 60);
	if (sErr || !data?.signedUrl) return jsonResponse(500, { error: 'Kon URL niet maken' });
	return jsonResponse(200, { signed_url: data.signedUrl, invoice_number: inv.invoice_number });
});
