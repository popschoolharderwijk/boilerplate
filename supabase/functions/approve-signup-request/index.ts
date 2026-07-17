// Approve a lesson signup request (staff only).
// - Creates auth user + profile + student record (if no user exists yet for the email)
// - For group requests: inserts lesson_group_members (trigger auto-creates lesson_agreement)
// - For individual requests: marks request approved; staff completes via AgreementWizard
//   (wizard prefills using fromRequest=<id>)
// Marks the request as approved and links created_agreement_id when applicable.

import { handleApproveSignupRequest } from './handler.ts';

Deno.serve(handleApproveSignupRequest);
