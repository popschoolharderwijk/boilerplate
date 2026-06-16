---
name: database-migraties
description: Verplicht het gebruik van Supabase-migratiebestanden voor elke databasewijziging in dit project (tabellen, kolommen, RLS, policies, GRANTs, functies, triggers, enums, views). Activeer deze skill bij elke vraag die de databasestructuur of -rechten raakt, bij elke "database reset", en bij elk runtime-symptoom dat op ontbrekende GRANTs/policies wijst (bv. "permission denied", 500 vanuit edge functions die in de DB schrijven, of "werkte voor de reset, nu niet meer").
---

# Database-wijzigingen → altijd via migratiebestand

Dit project draait op een externe Supabase Pro met branching en kent reguliere database resets (`bun run reset-db:dev`). Elke wijziging die niet in `supabase/migrations/` staat, is na de eerstvolgende reset verdwenen. Daarom is de regel hier hard.

## Harde regels

1. **Geen enkele schema- of rechtenwijziging zonder migratie.** Roep altijd de `supabase--migration` tool aan. Voer nooit ad-hoc DDL/GRANT/CREATE POLICY via `supabase--insert`, dashboard of psql uit.
2. **`supabase--insert` is uitsluitend voor data** (`INSERT`/`UPDATE`/`DELETE` op rijen). Zodra het SQL `CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE`, `CREATE POLICY`, `CREATE FUNCTION`, `CREATE TRIGGER`, `CREATE TYPE` of `CREATE INDEX` bevat → migratie.
3. **Elke nieuwe `public`-tabel krijgt in dezelfde migratie GRANTs**, in deze volgorde: `CREATE TABLE` → `GRANT` → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`. Zonder GRANTs faalt PostgREST en breekt het na de eerstvolgende reset.
4. **RLS policies zijn `PERMISSIVE` en geconsolideerd** (zie core memory). Splits niet onnodig in meerdere policies per actie.
5. **Views gebruiken `security_invoker=on`** (zie core memory).
6. **Migratienamen zijn logisch en in het Nederlands**, conform `mem://database/migration-naming-convention`. Bijvoorbeeld `..._herstel_grants_aanmeldingen.sql`, niet een UUID-suffix.
7. **Na elke migratie**: vermeld dat de gebruiker `bun run reset-db:dev` draait om types opnieuw te genereren (zie core memory).

## Standaard GRANT-blok

Stem af op de policies die je schrijft:

```sql
-- Auth-only tabel (alle policies scopen op auth.uid()):
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<tabel> TO authenticated;
GRANT ALL ON public.<tabel> TO service_role;

-- Tabel met publieke leesactie of openbaar insertformulier:
GRANT SELECT ON public.<tabel> TO anon;            -- alleen als een policy anon toestaat
GRANT INSERT ON public.<tabel> TO anon;            -- alleen als een INSERT-policy anon toestaat
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<tabel> TO authenticated;
GRANT ALL ON public.<tabel> TO service_role;
```

`service_role` is verplicht voor elke tabel die door edge functions of admin-scripts wordt aangeraakt.

## Reset-proof checklist (loop deze af bij elke DB-taak)

- [ ] Staat de wijziging in een bestand onder `supabase/migrations/`?
- [ ] Heeft het bestand een logische, Nederlandse naam?
- [ ] Heeft elke nieuwe tabel expliciete GRANTs voor de juiste rollen (incl. `service_role`)?
- [ ] Zijn RLS én policies in dezelfde migratie als de tabel?
- [ ] Geen `auth.users` als FK-target (gebruik `profiles`/`user_id`)?
- [ ] Na approval: heb ik de gebruiker gevraagd `bun run reset-db:dev` te draaien?

## Diagnose bij "werkte voor de reset, nu niet meer"

Bij 500's uit een edge function die in de DB schrijft, of `permission denied for table ...`, is de meest waarschijnlijke oorzaak: een eerdere ad-hoc `GRANT`/policy stond niet in een migratiebestand en is bij de reset verdwenen. Fix dit door een nieuw migratiebestand toe te voegen dat de ontbrekende GRANTs/policies opnieuw vastlegt — niet door opnieuw handmatig in het dashboard te klikken.

## Anti-patronen (niet doen)

- ❌ `supabase--insert` gebruiken voor `GRANT`, `CREATE POLICY`, `ALTER TABLE`, etc.
- ❌ Wijzigingen rechtstreeks in het Supabase-dashboard maken zonder ze in een migratiebestand vast te leggen.
- ❌ Een tabel aanmaken zonder GRANTs in dezelfde migratie.
- ❌ Migraties met alleen een UUID-suffix; gebruik een logische naam.
- ❌ Wijzigingen aanbrengen in `auth.*`, `storage.*`, `realtime.*`, `supabase_functions.*` of `vault.*`.
