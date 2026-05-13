# Plan: Stripe Lesgeld-Incasso (v2)

_Laatst bijgewerkt: 12 mei 2026_

## Doel
Maandelijkse SEPA-incasso van lesgeld via Stripe, gespreid over **11 maanden per jaar** (augustus overslaan), op basis van een prijs per les en de frequentie van de lessen per leerling. Financiële gegevens worden zoveel mogelijk bij Stripe opgeslagen, niet in onze database.

---

## Kernontwerp

### Prijzen per les
Opgeslagen op de bestaande tabel `lesson_type_options`, uitgebreid met **twee leeftijdstarieven** (geen nieuwe tabel, geen nieuwe componenten, bestaande RLS blijft van kracht):

| Frequentie   | Tarief <21    | Tarief 21+    |
|--------------|---------------|---------------|
| Wekelijks    | € 19,50 (1950 ct) | € 23,60 (2360 ct) |
| Tweewekelijks| € 20,55 (2055 ct) | € 24,98 (2498 ct) |

### Schooljaar
1 september → 31 juli (11 incassomaanden, augustus pauze).

### Berekening jaarbedrag
Aantal lessen/jaar wordt afgeleid uit `lesson_agreement` start/end + `no_lesson_periods`. Vervolgens:
- `yearlyCents = lessonsCount × pricePerLessonCents`
- `monthlyCents = floor(yearlyCents / 11)` met restbedrag in laatste maand

### Leeftijdsbepaling
Per schooljaar-fase op basis van `students.date_of_birth` op fase-startdatum (1 sept of agreement-start). Mid-year leeftijdsverandering triggert geen automatische tariefswitch (consistent met "geen proration"). Optioneel: handmatige fase-split op 21e verjaardag.

### Stripe Subscription Schedule
- 11 phases per jaar (sept t/m juli), augustus pauze, jaarlijks herhalend
- Beide flows: Checkout-link (eerste keer) of direct activeren op bestaand SEPA-mandaat
- Prijswijzigingen mid-year → nieuwe phase met `proration_behavior: "none"`, ingang vanaf volgende incassomaand

### Hergebruik bestaande componenten (geen nieuwe!)
`LessonTypeOptions` (form), `SubscriptionCard`, `useSubscription` hook, `create-subscription-checkout` edge function, `stripe-webhook`, `_shared/stripe.ts`, `Subscriptions.tsx`, `SUBSCRIPTION_STATUS_LABELS/VARIANTS`, `no_lesson_periods` helpers.

### Database-mirroring
Alleen IDs/status mirror in DB:
- `subscriptions.stripe_schedule_id` (nieuw)
- `lesson_agreements.stripe_schedule_id` (nieuw)
- `lesson_type_options.price_per_lesson_under_21_cents` (nieuw)
- `lesson_type_options.price_per_lesson_adult_cents` (nieuw)

---

## Stappenplan (10 stappen, individueel deploybaar)

### Stap 1 — Database migratie ✅ AFGEROND
- Kolommen `price_per_lesson_under_21_cents` en `price_per_lesson_adult_cents` toegevoegd aan `lesson_type_options`
- Backfill met standaardprijzen
- `stripe_schedule_id` toegevoegd aan `subscriptions` en `lesson_agreements`
- Bestaande RLS-policies ongewijzigd

### Stap 2 — UI prijzen invoeren ✅ AFGEROND
- `LessonTypeOptions` form uitgebreid met 2 `PriceInput` velden (<21, 21+)
- Beide verplicht > 0
- Tabel toont beide kolommen

### Stap 3 — Bereken-helper `calculateYearlyAmount`
Pure utility (geen component):
```typescript
{ lessonsCount, yearlyCents, monthlyCents, leftoverCents }
```
Houdt rekening met `no_lesson_periods` en augustus.

### Stap 4 — Live preview in agreement & subscription
- `LessonAgreementDialog`: readonly preview van #lessen/jaar/maand
- `SubscriptionCard`: knop "Activeer op bestaand mandaat"

### Stap 5 — Edge function `create-subscription-checkout` uitbreiden
- `mode: "checkout"` (huidige flow) of `mode: "direct"` (Schedule met phases)
- `buildSchoolYearPhases()` helper voor 11-maand phases met augustus pauze
- Service-role insert van `stripe_subscription_id` + `stripe_schedule_id`

### Stap 6 — Webhook events
- `checkout.session.completed` → schedule conversion
- `subscription_schedule.updated/canceled/released` → mirror naar `subscriptions`

### Stap 7 — Prijswijziging mid-year
- `updateAgreementPriceSchedule()` triggered bij prijs/frequentie wijziging
- Voegt extra phase toe met `proration_behavior: "none"`

### Stap 8 — `Subscriptions.tsx` overzicht
Extra kolommen: maandbedrag, volgende incassodatum, schedule status.

### Stap 9 — Tests
Unit tests, edge function tests, RLS tests.

### Stap 10 — Documentatie & handleiding
Update `/manual` met de nieuwe abonnementsflow.

---

## Beslissingen (vastgelegd)
- ✅ Augustus overslaan: ja, via Subscription Schedule phases
- ✅ Wie start incasso: beide flows (checkout én direct)
- ✅ Prijswijzigingen: vanaf volgende incassomaand, geen proration
- ✅ Leeftijdsbepaling: per fase-startdatum
- ✅ Geen nieuwe componenten waar bestaande beschikbaar zijn
- ✅ Bestaande RLS blijft gehanteerd
- ✅ Schooljaar: 1 september – 31 juli
