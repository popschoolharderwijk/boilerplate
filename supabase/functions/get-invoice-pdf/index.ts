// Returns a short-lived signed URL for an invoice PDF.
// RLS enforced via user JWT — students can only fetch their own invoice.
import { handleGetInvoicePdfRequest } from './handler.ts';

Deno.serve(handleGetInvoicePdfRequest);
