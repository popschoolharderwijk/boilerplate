// Public edge function: anyone can submit a signup request without an account.
// Inserts a row into lesson_signup_requests via service role (bypasses RLS for safety),
// after strict validation.

import { handleSubmitSignupRequest } from './handler.ts';

Deno.serve(handleSubmitSignupRequest);
