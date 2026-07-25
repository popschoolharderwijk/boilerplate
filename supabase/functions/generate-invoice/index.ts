// Generates invoices (one per student) for a given incasso batch.
// - Creates `invoices` + `invoice_lines` rows
// - Renders a Mplifi-styled PDF using pdf-lib
// - Uploads to private 'invoices' storage bucket
// - Sends invoice email with PDF attachment via Resend
//
// Body: { batch_id: string, send_email?: boolean }
// Auth: requires admin JWT.

import { handleGenerateInvoiceRequest } from './handler.ts';

Deno.serve(handleGenerateInvoiceRequest);
