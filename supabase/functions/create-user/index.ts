// Edge Function to create user accounts
// Only admins and site_admins can create users
// Admins cannot assign site_admin roles
// Site_admins can assign any role

import { processCreateUserRequest } from '../_shared/create-user-handlers.ts';
import { serveAuthenticatedJsonRequest } from '../_shared/http-serve.ts';

serveAuthenticatedJsonRequest(processCreateUserRequest);
