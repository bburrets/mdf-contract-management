import { z } from 'zod';

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database Configuration
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.string().regex(/^\d+$/, 'DB_PORT must be a number').transform(Number),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().optional(),
  
  // Alternative: DATABASE_URL (takes precedence if provided)
  DATABASE_URL: z.string().optional(),
  
  // NextAuth Configuration
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // Azure Document Intelligence (OCR) - Optional for development
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.string().url().optional(),
  AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string().optional(),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
  AZURE_DOCUMENT_INTELLIGENCE_KEY: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
};

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(processEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    
    throw new Error(`Environment validation failed:\n${missingVars}`);
  }
  throw error;
}

// Export validated environment variables
export { env };

// Type-safe environment variable access
export type Env = typeof env;