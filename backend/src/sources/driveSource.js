import { auth as googleAuth, drive as driveApi } from '@googleapis/drive';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';

/**
 * Reads the workbook from Google Drive with a service account (read-only scope).
 * The file must be shared with the service-account email as Viewer.
 * Works whether the file is an uploaded .xlsx or a native Google Sheet (exported to .xlsx).
 */
export function createDriveSource({ fileId, clientEmail, privateKey, keyFile }) {
  const authClient = new googleAuth.GoogleAuth({
    ...(keyFile ? { keyFile } : { credentials: { client_email: clientEmail, private_key: privateKey } }),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = driveApi({ version: 'v3', auth: authClient });

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
