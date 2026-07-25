// Create a Stripe Billing Portal session for the calling user.
// Privileged staff may pass user_id to open portal on behalf of a student.
import { handleCreateCustomerPortalRequest } from './handler.ts';

Deno.serve(handleCreateCustomerPortalRequest);
