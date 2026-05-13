CREATE TABLE public.email_templates (
	event_key text PRIMARY KEY,
	subject text NOT NULL,
	body_html text NOT NULL,
	is_enabled boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	created_by uuid,
	updated_by uuid
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_select ON public.email_templates
	FOR SELECT TO authenticated USING (true);

CREATE POLICY email_templates_insert_admin ON public.email_templates
	FOR INSERT TO authenticated WITH CHECK (is_admin() OR is_site_admin());

CREATE POLICY email_templates_update_admin ON public.email_templates
	FOR UPDATE TO authenticated
	USING (is_admin() OR is_site_admin())
	WITH CHECK (is_admin() OR is_site_admin());

CREATE POLICY email_templates_delete_admin ON public.email_templates
	FOR DELETE TO authenticated USING (is_admin() OR is_site_admin());

CREATE TRIGGER email_templates_set_audit_fields
	BEFORE INSERT OR UPDATE ON public.email_templates
	FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

INSERT INTO public.email_templates (event_key, subject, body_html, is_enabled) VALUES (
	'signup_received',
	'Bevestiging van je aanmelding bij Popschool Harderwijk',
	'<p>Hoi {{leerling_naam}},</p>
<p>Bedankt voor je aanmelding bij Popschool Harderwijk!</p>
<p>We hebben je aanvraag voor <strong>{{les_type}}</strong> ({{frequentie}}) ontvangen voor <strong>{{prijs_per_les}}</strong> per les.</p>
<p>We nemen zo snel mogelijk contact met je op om je inschrijving te verwerken.</p>
<p>Met muzikale groet,<br/>Popschool Harderwijk</p>',
	true
);