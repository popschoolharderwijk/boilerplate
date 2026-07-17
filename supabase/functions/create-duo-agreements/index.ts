// Creates two linked duo agreements (lesson_agreements) in a single transaction.
// Both agreements share the same duo_pair_id, the same time slot with the same teacher,
// and the same lesson type (which must have the is_duo_lesson flag). On failure, the first
// row is deleted so we do not end up in a half-finished state.
//
// Auth required. Toegestaan: admin, site_admin, teacher (staff).
import { handleCreateDuoAgreementsRequest } from './handler.ts';

Deno.serve((req) => handleCreateDuoAgreementsRequest(req));
