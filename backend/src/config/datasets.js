import { createSource } from '../sources/index.js';
import { createSyncRegistry, createSyncService } from '../services/syncService.js';
import { ingestOfficerReturn } from '../services/ingest/officerReturnIngest.js';
import { ingestAccidentTracker } from '../services/ingest/accidentTrackerIngest.js';

/**
 * Every workbook the backend syncs. Add an entry (plus its parser/ingest and env vars)
 * to bring a new sub-topic's data online.
 */
export const DATASETS = [
  {
    key: 'officer-return',
    label: 'Welfare Officer Return',
    ingest: ingestOfficerReturn,
    fileId: (env) => env.DRIVE_FILE_ID,
    localPath: (env) => env.LOCAL_WORKBOOK_PATH,
  },
  {
    key: 'accident-tracker',
    label: 'Safety Accident Tracker',
    ingest: ingestAccidentTracker,
    fileId: (env) => env.ACCIDENT_DRIVE_FILE_ID,
    localPath: (env) => env.ACCIDENT_LOCAL_WORKBOOK_PATH,
  },
];

export function createDatasetRegistry(env) {
  return createSyncRegistry(
    DATASETS.map((dataset) =>
      createSyncService({
        dataset,
        source: createSource(env, { fileId: dataset.fileId(env), localPath: dataset.localPath(env) }),
        ingest: dataset.ingest,
      }),
    ),
  );
}
