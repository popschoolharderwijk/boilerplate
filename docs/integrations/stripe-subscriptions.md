# Stripe abonnementen (SEPA incasso per lesovereenkomst)

Per `lesson_agreement` koppelen we één Stripe `Subscription` voor maandelijkse incasso.
Eerste betaling via **iDEAL** (verplicht in NL voor SEPA-mandaat), daarna automatisch via **SEPA Direct Debit**.

## Architectuur

```
lesson_agreements ──1───* subscriptions ──1───* subscription_invoices
                                │
                                └──> stripe_customers (1 per user_id)
```

- `lesson_agreements.stripe_price_id`: Stripe Price die gebruikt wordt bij Checkout (handmatig per agreement gezet, fase 1).
- `stripe_customers`: 1 rij per gebruiker, koppelt `user_id` ↔ `stripe_customer_id`.
- `subscriptions`: spiegel van Stripe Subscription (status, periode, default payment method).
- `subscription_invoices`: spiegel van Stripe Invoices voor facturatie/historie.

Alle tabellen hebben RLS + audit trail. Schrijfrechten zijn alleen voor service-role
(via webhook); lezen mag voor staff/admin én de betrokken student/teacher.

## Edge functions

| Functie | Auth | Doel |
|---|---|---|
| `create-subscription-checkout` | JWT | Maakt Checkout Session (setup-mode, iDEAL+SEPA-mandaat) |
| `create-customer-portal` | JWT | Opent Stripe Customer Portal voor de ingelogde gebruiker |
| `sync-stripe-subscription` | JWT | Trekt status van een subscription opnieuw uit Stripe |
| `stripe-webhook` | publiek (signature) | Verwerkt subscription/invoice events |

## Setup checklist (Stripe dashboard)

1. **Producten + prijzen aanmaken** per lesvariant (bv. "Gitaarles 30min wekelijks – €120/maand"), recurring `month`.
2. Zet de Stripe Price ID op de juiste `lesson_agreements.stripe_price_id`.
3. **Payment methods**: enable iDEAL én SEPA Direct Debit (Settings → Payment methods).
4. **Customer portal** activeren (Settings → Billing → Customer portal). Sta minimaal toe: betaalmethode wijzigen, factuurhistorie bekijken, abonnement annuleren.
5. **Webhook endpoint** registreren:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `setup_intent.succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.created`, `invoice.paid`, `invoice.payment_failed`, `invoice.finalized`
   - Kopieer de signing secret naar `STRIPE_WEBHOOK_SECRET`.

## Secrets

- `STRIPE_SECRET_KEY` — server-side Stripe key (sk_live / sk_test).
- `STRIPE_WEBHOOK_SECRET` — signing secret van het webhook endpoint.

Beide zijn alleen beschikbaar in edge functions via `Deno.env.get(...)`.
**Nooit** met `VITE_`-prefix.

## RLS-samenvatting

- `subscriptions` / `subscription_invoices`: SELECT voor `is_privileged()` of betrokken student/teacher van de gekoppelde `lesson_agreement`. INSERT/UPDATE/DELETE alleen via service-role (webhook).
- `stripe_customers`: SELECT voor eigenaar of `is_privileged()`. Schrijven alleen via service-role.

## Bekende beperkingen

- Fase 1 vereist handmatige koppeling van Stripe Price aan `lesson_agreements.stripe_price_id`.
- Prijswijzigingen in Stripe worden niet automatisch teruggeschreven naar `lesson_agreements.price_per_lesson`.
- Annuleren/pauzeren gebeurt in Stripe (klantportaal of dashboard); webhook synchroniseert status.
