# Legacy data-import

Importeer **lestypes (+ opties)**, **docenten**, **leerlingen** en **actieve overeenkomsten** uit een ouder systeem via een Excel-bestand. De import is idempotent: dezelfde rij dezelfde keer importeren wijzigt niets, en bestaande records worden bijgewerkt in plaats van gedupliceerd.

## Scope

In scope:

- `lesson_types` + `lesson_type_options`
- `teachers` (incl. lesvakken via `teacher_lesson_types`)
- `students` (incl. ouder/debiteur-velden)
- `lesson_agreements` (actieve overeenkomsten)

Niet in scope (bewust):

- Stripe-mandaten of subscriptions — niet-Stripe incasso wordt na de import per leerling opnieuw uitgenodigd via de bestaande SEPA-flow (`incasso_invitations`).
- Historische agenda-events, deviations en afzeggingen.
- Historische facturen.
- Welkomstmails — accounts worden zonder wachtwoord aangemaakt; gebruikers loggen later in via de bestaande magic-link flow.

## Werkwijze

1. Open **Instellingen → Data-import** (alleen zichtbaar voor `admin` / `site_admin`).
2. Klik **Download template** voor een leeg `.xlsx` met de juiste tabnamen en kolommen.
3. Vul het bestand met data uit het oude systeem. Eén tab per entiteit; kolomvolgorde maakt niet uit, kolomnamen wel.
4. Upload het bestand en klik **Valideren**. Eventuele fouten verschijnen rij voor rij; alleen bij 0 fouten kun je importeren.
5. Klik **Importeren** en bevestig. Het resultaat per entiteit (`created` / `updated` / `failed`) verschijnt onder; mislukte rijen kun je als CSV downloaden.

## Idempotentie

Per geïmporteerde rij wordt een mapping van `legacy_id → new uuid` opgeslagen in `public.legacy_ids`. Bij een tweede run:

- Een al-bekend `legacy_id` triggert een `UPDATE` van het bestaande record.
- Een onbekend `legacy_id` triggert een `INSERT` + nieuwe mapping-rij.
- Voor docenten/leerlingen wordt eerst gecheckt of het mailadres al een `auth.users` heeft; bestaande accounts worden hergebruikt.

## Tabs en kolommen

| Tab | Kolommen |
|---|---|
| `lesson_types` | `legacy_id, name, icon, color, is_group_lesson, cost_center, description, is_active` |
| `lesson_type_options` | `legacy_id, lesson_type_legacy_id, frequency, duration_minutes, price_per_lesson, price_per_lesson_adult_cents, price_per_lesson_under_21_cents` |
| `teachers` | `legacy_id, email, first_name, last_name, phone_number, bio, is_active, lesson_type_legacy_ids` (pipe-separated) |
| `students` | `legacy_id, email, first_name, last_name, phone_number, date_of_birth, parent_name, parent_email, parent_phone_number, debtor_info_same_as_student, debtor_name, debtor_address, debtor_postal_code, debtor_city` |
| `lesson_agreements` | `legacy_id, student_legacy_id, teacher_legacy_id, lesson_type_legacy_id, duration_minutes, frequency, price_per_lesson, day_of_week, start_time, start_date, end_date, notes, signup_source` |

Toegestane waarden:

- `frequency` ∈ `daily | weekly | biweekly | monthly`
- `day_of_week` ∈ `0..6` (0 = zondag)
- `icon` = naam uit `react-icons/lu` (bv. `LuPiano`)
- `color` = hex of tailwind kleur-token
- Datums = `YYYY-MM-DD`, tijden = `HH:MM` of `HH:MM:SS`

## Vervolgstap incasso

Na succesvolle import staan alle overeenkomsten op `is_active = true` met lege Stripe-velden. Stuur via **Leerlingen → SEPA-uitnodiging** per leerling (of in batch) een nieuwe uitnodiging om de incasso opnieuw op te zetten.

## Troubleshooting

- **"Geen rechten voor data-import"** — je rol is niet `admin` of `site_admin`.
- **Onbekende `lesson_type_legacy_id` / `student_legacy_id` / `teacher_legacy_id`** — de referentie staat niet in een eerder tab. Controleer de spelling.
- **Mailadres bestaat al** — geen probleem, het bestaande account wordt hergebruikt en de mapping bijgewerkt.
- **Te grote bestanden** — splits de Excel in delen per entiteit; de mapping zorgt dat opvolgende runs blijven kloppen.
