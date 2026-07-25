import { handleCorsPreflight } from '../_shared/http.ts';
import { authenticateGenerateSepaXmlRequest } from './authenticateGenerateSepaXmlRequest.ts';
import { executeGenerateSepaXml } from './executeGenerateSepaXml.ts';

export async function handleGenerateSepaXmlRequest(req: Request): Promise<Response> {
	const pf = handleCorsPreflight(req);
	if (pf) return pf;

	const auth = await authenticateGenerateSepaXmlRequest(req);
	if (!auth.ok) return auth.response;

	return executeGenerateSepaXml(auth.admin, auth.batchId);
}
