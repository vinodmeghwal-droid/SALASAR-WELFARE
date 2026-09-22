import { auth as googleAuth, drive as driveApi } from '@googleapis/drive';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

/**
 * Reads the workbook from Google Drive (read-only scope), authenticated either as
 * - the file owner, via an OAuth refresh token (`oauth`), or
 * - a service account the file is shared with as Viewer (`serviceAccount`).
 * Works whether the file is an uploaded .xlsx or a native Google Sheet (exported to .xlsx).
 */
export function createDriveSource({ fileId, oauth, serviceAccount }) {
  const drive = driveApi({ version: 'v3', auth: oauth ? oauthClient(oauth) : serviceAccountClient(serviceAccount) });

  return {
    kind: 'drive',

    /** Cheap call used on every poll to detect changes. */
    async getMetadata() {
      const { data } = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,modifiedTime,md5Checksum,version,webViewLink',
        supportsAllDrives: true,
      });
      return {
        fileId: data.id,
        fileName: data.name,
        mimeType: data.mimeType,
        webViewLink: data.webViewLink,
        modifiedTime: data.modifiedTime ? new Date(data.modifiedTime) : null,
        // md5 is absent for native Google Sheets; version increments on every edit.
        revision: `${data.version ?? ''}:${data.md5Checksum ?? data.modifiedTime ?? ''}`,
      };
    },

    async download(metadata) {
      const res =
        metadata.mimeType === GOOGLE_SHEET_MIME
          ? await drive.files.export({ fileId, mimeType: XLSX_MIME }, { responseType: 'arraybuffer' })
          : await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    },
  };
}

function oauthClient({ clientId, clientSecret, refreshToken }) {
  const client = new googleAuth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken }); // access tokens are refreshed automatically
  return client;
}

function serviceAccountClient({ clientEmail, privateKey, keyFile }) {
  return new googleAuth.GoogleAuth({
    ...(keyFile ? { keyFile } : { credentials: { client_email: clientEmail, private_key: privateKey } }),
    scopes: [DRIVE_SCOPE],
  });
}
