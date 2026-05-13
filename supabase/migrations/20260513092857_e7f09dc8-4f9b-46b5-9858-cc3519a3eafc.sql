INSERT INTO public.email_templates (event_key, subject, body_html, is_enabled) VALUES (
	'trial_scheduled',
	'Je proefles bij Popschool Harderwijk is ingepland',
	'<p>Hoi {{leerling_naam}},</p>
<p>Je proefles voor <strong>{{les_type}}</strong> is ingepland op <strong>{{datum}}</strong> om <strong>{{tijd}}</strong> ({{duur}} minuten).</p>
<p>Na de proefles kun je in de portal aangeven of je verder wilt met lessen. Pas dan stellen we een definitieve overeenkomst op.</p>
<p>Veel plezier en tot dan!<br/>Popschool Harderwijk</p>',
	true
) ON CONFLICT (event_key) DO NOTHING;