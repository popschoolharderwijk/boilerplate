// Recompute prices on an existing Stripe Subscription Schedule for a lesson_agreement.
// Past + currently active phases are kept verbatim; future phases are replaced
// with newly computed amounts based on current `lesson_type_options`.
//
// Auth required. Privileged staff/admin only — students cannot trigger this.
import { handleRebuildSubscriptionScheduleRequest } from './handler.ts';

Deno.serve((req) => handleRebuildSubscriptionScheduleRequest(req));
