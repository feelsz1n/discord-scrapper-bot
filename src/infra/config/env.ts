import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_BOT_NAME: z.string(),
  OWNER_ID: z.string(),
  BASE_URL: z.string().url(),
  PROXY_URL: z.string().url(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
