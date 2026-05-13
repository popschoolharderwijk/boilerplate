INSERT INTO public.email_templates (event_key, subject, body_html, is_enabled)
VALUES (
  'trial_scheduled_teacher',
  'Nieuwe proefles ingepland: {{leerling_naam}}',
  '<p>Hoi {{docent_naam}},</p>
<p>Er is een proefles voor je ingepland.</p>
<ul>
  <li><strong>Leerling:</strong> {{leerling_naam}}</li>
  <li><strong>Lessoort:</strong> {{les_type}}</li>
  <li><strong>Datum:</strong> {{datum}}</li>
  <li><strong>Tijd:</strong> {{tijd}} ({{duur}} minuten)</li>
</ul>
<p>De afspraak staat in je agenda.</p>
<p>Groet,<br/>Popschool Harderwijk</p>',
  true
)
ON CONFLICT (event_key) DO NOTHING;