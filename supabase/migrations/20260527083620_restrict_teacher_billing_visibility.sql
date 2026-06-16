-- Restrict teachers from seeing subscription / incasso / bank info on lesson agreements.
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
FOR SELECT TO authenticated
USING (
  is_privileged() OR EXISTS (
    SELECT 1 FROM lesson_agreements la
    WHERE la.id = subscriptions.lesson_agreement_id
      AND la.student_user_id = current_user_id()
  )
);

DROP POLICY IF EXISTS subscription_invoices_select ON public.subscription_invoices;
CREATE POLICY subscription_invoices_select ON public.subscription_invoices
FOR SELECT TO authenticated
USING (
  is_privileged() OR EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN lesson_agreements la ON la.id = s.lesson_agreement_id
    WHERE s.id = subscription_invoices.subscription_id
      AND la.student_user_id = current_user_id()
  )
);