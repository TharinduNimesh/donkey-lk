import { z } from 'zod';

const envSchema = z.object({
  FACEBOOK_ACCESS_TOKEN: z.string().min(1, 'Facebook access token is required'),
});

function getEnvVars() {
  const env = {
    FACEBOOK_ACCESS_TOKEN: process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => issue.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const env = getEnvVars();