import { z } from "zod"

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  DATABASE_CONNECT_ON_BOOT: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  WEB_ORIGINS: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_PUBLIC_BASE_URL: z.string().url(),
})

export type Environment = z.infer<typeof environmentSchema>

export function loadEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = environmentSchema.safeParse(input)
  if (parsed.success) return parsed.data

  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")
  throw new Error(`Invalid environment configuration: ${details}`)
}
