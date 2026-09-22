import { z } from 'zod';

/**
 * Single source of truth for configuration. Validated once at startup so a
 * missing variable fails loudly instead of surfacing as a runtime 500.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // Shared secret between the Next.js server and this API. The browser never sees it.
    INTERNAL_API_KEY: z.string().min(16, 'INTERNAL_API_KEY must be at least 16 characters'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    // Data source: "drive" (production) or "local" (offline development against a copy of the workbook).
    DATA_SOURCE: z.enum(['drive', 'local']).default('drive'),
    DRIVE_FILE_ID: z.string().default('1zX5lpXgQcoyz5QJDRyJQCFc-jQb3SEM1'),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_KEY_FILE: z.string().optional(),
    LOCAL_WORKBOOK_PATH: z.string().optional(),

    SYNC_INTERVAL_SECONDS: z.coerce.number().int().min(10).default(30),
  })
  .superRefine((env, ctx) => {
    if (env.DATA_SOURCE === 'drive') {
      const hasInline = env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
      if (!hasInline && !env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
        ctx.addIssue({
          code: 'custom',
          message:
            'DATA_SOURCE=drive needs GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, or GOOGLE_SERVICE_ACCOUNT_KEY_FILE',
        });
      }
    }
    if (env.DATA_SOURCE === 'local' && !env.LOCAL_WORKBOOK_PATH) {
      ctx.addIssue({ code: 'custom', message: 'DATA_SOURCE=local needs LOCAL_WORKBOOK_PATH' });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`).join('\n');
  console.error(`\nInvalid environment configuration:\n${issues}\n\nSee backend/.env.example\n`);
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  // .env files store the PEM with literal "\n" sequences.
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: parsed.data.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
});
