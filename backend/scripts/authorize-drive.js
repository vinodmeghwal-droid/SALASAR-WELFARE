// One-time: let the backend read the workbook as its owner (read-only Drive access).
//
// Prerequisites
//   1. backend/.env has GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET
//      (the same OAuth client used for dashboard sign-in is fine).
//   2. That OAuth client lists this Authorized redirect URI:  http://localhost:5555/oauth2callback
//
// Usage: npm run drive:authorize   → open the printed URL, sign in as the file owner, approve.
// The refresh token is printed; put it in backend/.env as GOOGLE_OAUTH_REFRESH_TOKEN.
import { createServer } from 'node:http';
import { auth as googleAuth, drive as driveApi } from '@googleapis/drive';
import { DRIVE_SCOPE } from '../src/sources/driveSource.js';

const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const { GOOGLE_OAUTH_CLIENT_ID: clientId, GOOGLE_OAUTH_CLIENT_SECRET: clientSecret, DRIVE_FILE_ID: fileId } = process.env;

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend/.env first.');
  process.exit(1);
}

const client = new googleAuth.OAuth2(clientId, clientSecret, REDIRECT_URI);
const url = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // always return a refresh token
  scope: [DRIVE_SCOPE],
  login_hint: process.env.DRIVE_OWNER_EMAIL ?? 'vinod.meghwal@salasartechno.com',
});

const server = createServer(async (req, res) => {
  const { pathname, searchParams } = new URL(req.url, REDIRECT_URI);
  if (pathname !== '/oauth2callback') return res.writeHead(404).end();

  try {
    const error = searchParams.get('error');
    if (error) throw new Error(error);
    const { tokens } = await client.getToken(searchParams.get('code'));
    if (!tokens.refresh_token) throw new Error('No refresh token returned — remove the app at myaccount.google.com/permissions and retry.');

    client.setCredentials(tokens);
    const { data } = await driveApi({ version: 'v3', auth: client }).files.get({
      fileId: fileId || '1zX5lpXgQcoyz5QJDRyJQCFc-jQb3SEM1',
      fields: 'name',
      supportsAllDrives: true,
    });

    res.writeHead(200, { 'content-type': 'text/plain' }).end('Authorized. You can close this tab and return to the terminal.');
    console.log(`\n✔ Access verified — can read "${data.name}".\n\nAdd to backend/.env:\n\nGOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\nDATA_SOURCE=drive\n`);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end(`Authorization failed: ${err.message}`);
    console.error(`\n✖ Authorization failed: ${err.message}\n`);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`\nOpen this URL and sign in as the workbook owner:\n\n${url}\n\nWaiting for Google on ${REDIRECT_URI} …`);
});
