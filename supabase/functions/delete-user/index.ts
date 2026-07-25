// Edge Function to delete user accounts
// Supports two modes:
// 1. Self-deletion: User deletes their own account (no userId in body)
// 2. Admin deletion: Admin/site_admin deletes another user's account (userId in body)
//
// Uses admin API to delete from auth.users, which CASCADE deletes profile and roles
// The database trigger `protect_last_site_admin` prevents deleting the last site_admin

import { serveAuthenticatedJsonRequest } from '../_shared/http-serve.ts';
import { handleDeleteUserRequest } from './handler.ts';

serveAuthenticatedJsonRequest(handleDeleteUserRequest);
