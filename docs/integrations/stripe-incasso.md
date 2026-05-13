# Stripe-incasso (SEPA, per lesovereenkomst)

Eén centraal document dat de volledige Stripe-flow beschrijft: van de uitnodigingsmail tot de maandelijkse SEPA-incasso, inclusief schedule-fases, webhooks en beheer.

> Vervangt het oudere document `stripe-subscriptions.md` (verwijderd op 13 mei 2026).

## 1. Wat doen we?

Per `lesson_agreements`-rij koppelen we **één Stripe `Subscription`** voor maandelijkse incasso.

- **Eerste stap (setup):** klant kiest betaalmethode via **iDEAL** in Stripe Checkout (verplicht in NL voor het afgeven van een SEPA-mandaat).
- **Daarna:** maandelijks automatisch incasseren via **SEPA Direct Debit** op het afgegeven mandaat.
- **Schedule-fases:** een `SubscriptionSchedule` definieert per maand het exacte bedrag, zodat schoolvakanties en de juiste leeftijdscategorie (BTW) verdisconteerd worden in een vaste maandtermijn.
- **Beheer:** klant beheert betaalmethode/factuur/annulering via de Stripe **Customer Portal**; admin kan namens de klant het portaal openen.

## 2. End-to-end flow

```text
[Overeenkomst (admin)]
        │
        │ 1. SubscriptionCard → "Stuur betaaluitnodiging"
        ▼
[send-incasso-invite] ──► magic-link mail naar leerling/ouder
                                │
                                │ 2. klik link
                                ▼
                       [/incasso/start]  (IncassoStart.tsx)
                                │
                                │ 3. magic-link → sessie (PKCE of token_hash)
                                │ 4. POST create-subscription-checkout {mode:"checkout"}
                                ▼
                    [Stripe Checkout — iDEAL setup]
                                │
                                │ 5. setup_intent.succeeded (webhook)
                                ▼
                  [stripe-webhook] maakt SubscriptionSchedule
                                │
                                │ 6. customer.subscription.created/updated
                                ▼
                       [subscriptions tabel]  (status: scheduled → active)
                                │
                                │ 7. maandelijks invoice.created → invoice.paid
                                ▼
                  [subscription_invoices tabel]
```

## 3. Datamodel

| Tabel | Doel |
|---|---|
| `stripe_customers` | 1:1 koppeling tussen `auth.users.id` en `stripe_customer_id`. |
| `subscriptions` | Spiegel van Stripe Subscription. Bevat `lesson_agreement_id`, status, periode, default payment method (merk/last4), `stripe_schedule_id`. |
| `subscription_schedule_phases` | Per maand één rij met start/end, `amount_cents`, `price_id`. Maakt audit en rebuild mogelijk. |
| `subscription_invoices` | Spiegel van Stripe Invoices: bedrag, status, `hosted_invoice_url`, periode. |
| `incasso_invitations` | Logt elke verzonden uitnodiging (timestamp, magic-link ID, agreement). |

Alle tabellen hebben **PERMISSIVE, geconsolideerde** RLS. Schrijven is alleen toegestaan voor de service-role (webhook of edge function); lezen mag voor:
- `is_privileged()` (admin/staff)
- de gekoppelde leerling of docent van de `lesson_agreement`

## 4. Edge functions

| Functie | Auth | Doel |
|---|---|---|
| `send-incasso-invite` | JWT (admin/staff) | Genereert server-side magic link, mailt deze naar de leerling, logt in `incasso_invitations`. |
| `create-subscription-checkout` | JWT | Maakt Stripe Checkout (mode=`checkout`) of activeert direct op een bestaand mandaat (mode=`direct`) of rondt een retour-flow af (mode=`complete`). |
| `create-customer-portal` | JWT | Opent Stripe Customer Portal voor de ingelogde gebruiker (of voor een meegegeven `user_id` als de aanroeper privileged is). |
| `sync-stripe-subscription` | JWT (admin/staff) | Trekt status van een subscription opnieuw uit Stripe en schrijft naar de DB. |
| `rebuild-subscription-schedule` | JWT (admin/staff) | Herberekent de toekomstige schedule-fases met de huidige tarieven (na prijswijziging). |
| `force-start-subscription` | JWT (admin) | **Dev/test only.** Cancelt het bestaande schedule en start het abonnement onmiddellijk. UI-knop staat achter `import.meta.env.DEV`. |
| `stripe-webhook` | publiek (signature-validatie) | Ontvangt en verwerkt Stripe-events. |

Gedeelde logica staat in `supabase/functions/_shared/`:
- `billing.ts` — schoolyear, occurrences, `calculateYearly`, `pickAgeTariff`, schedule-fase-bouwers.
- `stripe.ts` — Stripe-client constructor (npm:stripe).
- `subscription-storage.ts` — DB upserts voor `subscriptions` en `subscription_schedule_phases`.
- `errors.ts` — `getSafeErrorMessage` (geen interne stack-traces lekken).

## 5. Magic link & email

De uitnodigingsmail (`docs/email-templates/magic-link.html`) gebruikt het custom `token_hash` formaat:

```
{{ .RedirectTo }}#token_hash={{ .TokenHash }}&type=email
```

Hierdoor consumeren mail-scanners (Outlook/SafeLinks) de link niet vooraf, want `verifyOtp` met token_hash vereist een actieve browsersessie.

`IncassoStart` (`src/pages/IncassoStart.tsx`) verwerkt twee link-formaten via `src/lib/auth/magicLink.ts`:

1. **PKCE** — `?code=...` in querystring → `supabase.auth.exchangeCodeForSession`.
2. **Custom token_hash** — `#token_hash=...&type=email` → `supabase.auth.verifyOtp`.

De legacy implicit-flow (`#access_token=...&refresh_token=...`) wordt **niet** meer ondersteund; de huidige template levert geen access_tokens in de hash.

## 6. Webhook events

`stripe-webhook` verwerkt:

| Event | Effect |
|---|---|
| `checkout.session.completed` | Logt de afgeronde Checkout, koppelt `setup_intent` aan agreement. |
| `setup_intent.succeeded` | Mandaat actief → maakt `SubscriptionSchedule` aan met fases uit `_shared/billing.ts`. |
| `customer.subscription.created` / `updated` | Upsert in `subscriptions` (status, periode, default payment method). |
| `customer.subscription.deleted` | Status → `canceled`. |
| `invoice.created` / `finalized` / `paid` / `payment_failed` | Upsert in `subscription_invoices`. |

Signing: gebruik **`STRIPE_WEBHOOK_SECRET`** voor signature-validatie. Falende validatie geeft 401 zonder details te lekken.

## 7. Edge cases

- **Bestaand mandaat hergebruiken** — `mode: 'direct'` slaat Checkout over en activeert het abonnement op het al gekoppelde `default_payment_method`.
- **Prijswijziging** — admin klikt "Pas nieuwe tarieven toe" → `rebuild-subscription-schedule` herberekent alleen toekomstige fases (huidige fase blijft staan om de lopende factuur niet te raken).
- **Mislukte betaling** — `invoice.payment_failed` zet de subscription op `past_due`. UI toont status-badge; klant lost op via Customer Portal.
- **Mandaat ingetrokken** — Stripe stuurt `payment_method.detached` / subscription wordt `unpaid`. Admin kan een nieuwe uitnodiging sturen.
- **Leerling wordt 21 mid-jaar** — `pickAgeTariff` (zie `_shared/billing.ts`) bepaalt per `lessonDate` welk tarief geldt; de schedule-fases verdisconteren dit per maand.

## 8. Stripe dashboard checklist

1. **Producten + prijzen** aanmaken per lesvariant (recurring `month`). Zet de Stripe Price ID op de juiste `lesson_agreements.stripe_price_id`.
2. **Payment methods** activeren: iDEAL én SEPA Direct Debit (Settings → Payment methods).
3. **Customer portal** activeren (Settings → Billing → Customer portal). Sta minimaal toe: betaalmethode wijzigen, factuurhistorie bekijken, abonnement annuleren.
4. **Webhook endpoint** registreren:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `setup_intent.succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.created`, `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`
   - Kopieer signing secret naar `STRIPE_WEBHOOK_SECRET`.

## 9. Secrets

Allemaal alleen beschikbaar in edge functions via `Deno.env.get(...)` — **nooit** met `VITE_` prefix:

- `STRIPE_SECRET_KEY` — server-side Stripe key (sk_live / sk_test).
- `STRIPE_WEBHOOK_SECRET` — signing secret van het webhook endpoint.
- `SUPABASE_SERVICE_ROLE_KEY` — voor schrijven in DB vanuit webhook.

## 10. Lokaal testen

```bash
# Webhook forwarden naar lokale dev
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook

# Unit tests voor billing-logica
cd supabase/functions/_shared && deno test billing_test.ts
```

Stripe testkaarten / iDEAL-simulator: zie [Stripe testing docs](https://stripe.com/docs/testing).

## 11. Bekende beperkingen / TODO

- **Per-situatie mailtemplates** (nieuwe overeenkomst, herinnering, mislukte betaling, mandaat ingetrokken) — wachten op Resend keys; flow is voorbereid in `send-incasso-invite`.
- **Prijswijzigingen Stripe → DB** worden niet teruggeschreven naar `lesson_agreements.price_per_lesson`; admin past tarief in de app aan en klikt "Pas nieuwe tarieven toe".
- **`force-start-subscription`** is alleen voor dev/test (UI-knop achter `import.meta.env.DEV`).
