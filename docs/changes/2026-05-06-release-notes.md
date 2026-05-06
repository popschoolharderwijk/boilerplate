# Release Notes — 6 mei 2026

## Wat is er aangepast?

- **Groepslessen** tonen nu de namen van deelnemende leerlingen, klikbaar naar het leerlingdetail.
- **Leerlingen overzicht** toont per leerling het aantal overeenkomsten en aanmeldingen, beide klikbaar.
- **Nieuw: Leerlingdetail** (`/students/:userId`) — alleen voor admin/staff/site_admin/developer. Toont profielgegevens, alle overeenkomsten en alle aanmeldingen, met doorklik naar details.
- **Leerlingenportal** (`/students/my-profile`) — leerlingen zien hun eigen overeenkomsten en aanmeldingen.
- **Sidebar** — leerlingen zien "Mijn profiel" bovenaan; het dashboard is voor leerlingen verborgen.
- **Handleiding** (`/manual`) — bijgewerkt met sectie "Groepslessen" en uitgebreide sectie "Leerlingen".

## Waar moeten reviewers/testers naar kijken?

1. UI: navigeer en doorklikgedrag op `/lesson-groups`, `/students`, `/students/:userId`, `/students/my-profile`.
2. Autorisatie: gedrag per rol (site_admin, admin, staff, teacher, student).
3. RLS: data-zichtbaarheid voor `lesson_agreements` en `lesson_signup_requests` per rol.
4. Sidebar: juiste items zichtbaar per rol; geen dashboard voor leerlingen.

---

## Testscenario's

### A. Groepslessen (`/lesson-groups`)

**Happy path**
- A1. Login als admin → open groepslessen → elke groep met deelnemers toont de namen van de leerlingen.
- A2. Klik op een leerlingnaam binnen een groep → navigeert naar `/students/:userId` met de juiste leerling.

**Edge cases**
- A3. Groep zonder deelnemers → toont nette lege staat ("geen leerlingen") zonder errors.
- A4. Leerling met `left_date` in het verleden → wordt niet getoond als actief lid.
- A5. Login als docent die de groep geeft → ziet alleen eigen groepen + deelnemers (RLS `lesson_groups_select` + `lesson_group_members_select`).
- A6. Login als leerling die in de groep zit → ziet alleen de eigen groep, en deelnemers conform RLS (zie sectie RLS hieronder).
- A7. Veel deelnemers (>20) → lijst blijft leesbaar (geen layoutbreuk).

### B. Leerlingenlijst (`/students`)

**Happy path**
- B1. Login als admin → leerlingen zijn zichtbaar; kolommen "Overeenkomsten" en "Aanmeldingen" tonen aantallen.
- B2. Klik op een leerlingnaam → navigeert naar `/students/:userId`.
- B3. Klik op het aantal overeenkomsten of aanmeldingen → navigeert naar `/students/:userId`.
- B4. Zoeken op naam/e-mail filtert correct.
- B5. URL `?search=lucas` zet de zoekterm op mount en wist de query string.

**Edge cases**
- B6. Leerling zonder e-mail → "Aanmeldingen" toont 0 (geen crash).
- B7. Leerling met aanmelding maar zonder overeenkomst → toont 0 / 1 in de juiste kolom.
- B8. Login als staff → zelfde gedrag als admin (geen edit-rechten in detail mogelijk via RLS, maar lezen werkt).
- B9. Login als docent → menu "Leerlingen" niet zichtbaar; directe URL `/students` blijft conform bestaande gedrag (geen escalation).
- B10. Login als leerling → menu "Leerlingen" niet zichtbaar; directe URL `/students/:userId` redirect naar `/`.

### C. Leerlingdetail (`/students/:userId`)

**Happy path**
- C1. Admin opent detail → ziet profiel (naam, email, telefoon), lijst overeenkomsten, lijst aanmeldingen.
- C2. Klik op een overeenkomst → opent overeenkomstdetail/dialog.
- C3. Klik op een aanmelding → opent `SignupRequestDialog` met alle ingevulde velden.
- C4. Leerling met meerdere overeenkomsten → alle staan in de lijst, gesorteerd zoals verwacht.

**Edge cases**
- C5. Onbekende `:userId` → nette "niet gevonden" of redirect, geen crash.
- C6. Leerling zonder overeenkomsten en zonder aanmeldingen → beide secties tonen lege staat.
- C7. Leerling met aanmelding op ander e-mailadres dan profiel-e-mail → zichtbaar voor admin (op `student_user_id`/email join), niet voor de leerling zelf (zie RLS).
- C8. Login als docent → directe URL `/students/:userId` redirect naar `/`.
- C9. Login als leerling → directe URL naar andere leerling redirect naar `/`.
- C10. Login als leerling op eigen URL → redirect naar `/` (detail is admin-only); zien gebeurt via `/students/my-profile`.

### D. Leerlingenportal (`/students/my-profile`)

- D1. Login als leerling → ziet eigen profiel, eigen overeenkomsten, eigen aanmeldingen.
- D2. Geen overeenkomsten/aanmeldingen → nette lege staten.
- D3. Login als niet-leerling → route niet beschikbaar in de sidebar (route blijft toegankelijk maar leeg/redirect).

### E. Sidebar

- E1. Leerling: "Mijn profiel" staat bovenaan, geen "Dashboard"-item.
- E2. Docent: geen "Mijn profiel", wel "Dashboard" en "Mijn leerlingen".
- E3. Admin/staff/site_admin: geen "Mijn profiel", wel volledige navigatie.

---

## RLS-verificatie

### `lesson_agreements`

Policy `lesson_agreements_select`:
```
student_user_id = current_user_id()
OR teacher_user_id = get_teacher_user_id(current_user_id())
OR is_privileged()
```

| Rol           | Zicht                                                         |
|---------------|---------------------------------------------------------------|
| site_admin    | Alle overeenkomsten                                           |
| admin         | Alle overeenkomsten                                           |
| staff         | Alle overeenkomsten (via `is_privileged`)                     |
| teacher       | Alleen overeenkomsten waar hij/zij `teacher_user_id` is       |
| student       | Alleen overeenkomsten waar hij/zij `student_user_id` is       |
| anon          | Geen toegang (rol `authenticated` vereist)                    |

**Validatie-queries (uit te voeren via test runner / supabase impersonation):**
- Als student X: `select count(*) from lesson_agreements` → moet gelijk zijn aan eigen overeenkomsten.
- Als teacher Y: idem, alleen eigen records.
- Als admin: telt alle records.
- Als student X: `select * from lesson_agreements where student_user_id <> X` → 0 rijen.

### `lesson_signup_requests`

Policy `lesson_signup_requests_select`:
```
is_privileged()
OR lower(email) = lower((select email from profiles where user_id = current_user_id()))
```

| Rol           | Zicht                                                                    |
|---------------|--------------------------------------------------------------------------|
| site_admin    | Alle aanmeldingen                                                        |
| admin         | Alle aanmeldingen                                                        |
| staff         | Alle aanmeldingen                                                        |
| teacher       | **Alleen** aanmeldingen waarvan email = teacher's eigen profielemail     |
| student       | Alleen aanmeldingen waarvan email = eigen profielemail                   |
| anon          | Geen SELECT (wel INSERT voor pending requests via publieke aanmeldformulier) |

**Validatie-queries:**
- Als student X met email `x@test.nl`: `select * from lesson_signup_requests` → alleen rijen met `lower(email)='x@test.nl'`.
- Als teacher: ziet alleen aanmeldingen met eigen email (let op: aanmeldingen worden normaal niet aan een teacher-email gekoppeld, dus verwacht 0 rijen — bevestig dit gedrag).
- Als admin: ziet alle aanmeldingen.
- Aanmelding aanmaken zonder login (anon) met `status='pending'`, `created_agreement_id=null`, `processed_by=null`, `processed_at=null` moet slagen; met andere status moet falen.

**Aandachtspunt voor reviewer**
- De koppeling student ↔ aanmelding gebeurt via `lower(email)`. Wanneer een leerling een ander e-mailadres in `profiles` heeft dan in de aanmelding gebruikt is, ziet die leerling z'n eigen aanmelding **niet**. Dit is bewust (privacy), maar bevestig dit met een testcase (C7 hierboven).
- Op het leerlingdetail (admin view) worden aanmeldingen opgehaald via `email`-match met de leerling — admin ziet ze omdat `is_privileged()` truthy is, dus emailmatch is daar niet beperkend.

---

## Snelle smoke-test checklist

- [ ] `/lesson-groups`: leerlingnamen zichtbaar en klikbaar
- [ ] `/students`: aantallen kolommen, klik navigeert
- [ ] `/students/:userId`: laadt voor admin, redirect voor niet-privileged
- [ ] `/students/my-profile`: laadt voor leerling met eigen data
- [ ] Sidebar per rol correct
- [ ] RLS-tellingen kloppen voor admin / teacher / student
