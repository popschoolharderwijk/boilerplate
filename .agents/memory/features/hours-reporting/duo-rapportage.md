---
name: Duo-lessen in urenrapportage
description: get_hours_report levert per duo-lestype twee rapportregels (teacher_block en student_lesson) met expliciete weegfactoren
type: feature
---
Voor duo-lestypen (lesson_types.is_duo_lesson=true) emit `get_hours_report` per (teacher, lesson_type, age_category) twee rijen:
- `duo_perspective = 'teacher_block'`: 0.5 les + duur/2 per leerling-occurrence. Som per duo-occurrence = 1 lesblok + volledige duur, BTW gesplitst per leerling (per-leerling BTW-categorie).
- `duo_perspective = 'student_lesson'`: 1 les + volledige duur per leerling-occurrence. Som per duo-occurrence = 2 lessen + 2x duur (per-leerling weergave).

Niet-duo en project-rijen hebben `duo_perspective = null`.

UI (Reports.tsx):
- Reports rij-key bevat `duo_perspective` om dubbele rij-keys te voorkomen.
- Lestype-cel toont kleine badge ("docent-blokken" / "per leerling") bij duo-rijen.
- Summary-totalen filteren `duo_perspective === 'student_lesson'` uit zodat duo-uren niet dubbel tellen — `teacher_block` is de canonieke bron voor totalen.
