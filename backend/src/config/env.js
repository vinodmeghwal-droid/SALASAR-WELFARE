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
    ACCIDENT_DRIVE_FILE_ID: z.string().default('1Wp1VCKwV-epBvyBpohE_7e71_O5vMC2B'),
    ACCIDENT_LOCAL_WORKBOOK_PATH: z.string().optional(),
    // Alternative to a service account: read Drive as the file owner via an OAuth refresh token
    // (obtain it with `npm run drive:authorize`).
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
    GOOGLE_OAUTH_REFRESH_TOKEN: z.string().optional(),

    SYNC_INTERVAL_SECONDS: z.coerce.number().int().min(10).default(30),

    // AI insights (optional). Without a key the insights endpoint reports "not configured".
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-flash-latest'),
    GEMINI_FALLBACK_MODELS: z.string().default('gemini-3.8-flash,gemini-3.5-flash,gemini-flash-lite-latest'),
  })
  .superRefine((env, ctx) => {
    if (env.DATA_SOURCE === 'drive') {
      const hasServiceAccount =
        (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) || env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
      const hasOAuth = env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_REFRESH_TOKEN;
      if (!hasServiceAccount && !hasOAuth) {
        ctx.addIssue({
          code: 'custom',
          message:
            'DATA_SOURCE=drive needs either GOOGLE_OAUTH_CLIENT_ID + _CLIENT_SECRET + _REFRESH_TOKEN (npm run drive:authorize), or a service account (GOOGLE_SERVICE_ACCOUNT_EMAIL + _PRIVATE_KEY, or _KEY_FILE)',
        });
      }
    }
    if (env.DATA_SOURCE === 'local' && !(env.LOCAL_WORKBOOK_PATH && env.ACCIDENT_LOCAL_WORKBOOK_PATH)) {
      ctx.addIssue({
        code: 'custom',
        message: 'DATA_SOURCE=local needs LOCAL_WORKBOOK_PATH and ACCIDENT_LOCAL_WORKBOOK_PATH',
      });
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
