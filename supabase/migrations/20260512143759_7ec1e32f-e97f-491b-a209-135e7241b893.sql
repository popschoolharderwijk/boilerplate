CREATE TABLE public.incasso_invitations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	lesson_agreement_id uuid NOT NULL REFERENCES public.lesson_agreements(id) ON DELETE CASCADE,
	recipient_email text NOT NULL,
	sent_by uuid,
	sent_at timestamptz NOT NULL DEFAULT now(),
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incasso_invitations_agreement ON public.incasso_invitations(lesson_agreement_id, sent_at DESC);

ALTER TABLE public.incasso_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY incasso_invitations_select ON public.incasso_invitations
	FOR SELECT TO authenticated
	USING (
		is_admin()
		OR is_site_admin()
		OR EXISTS (
			SELECT 1 FROM public.lesson_agreements la
			WHERE la.id = incasso_invitations.lesson_agreement_id
			  AND la.student_user_id = current_user_id()
		)
	);