import { z } from 'zod';

const platformRatesSchema = z.object({
  YOUTUBE: z.number(),
  FACEBOOK: z.number(),
  TIKTOK: z.number(),
  INSTAGRAM: z.number(),
});

const deadlineMultipliersSchema = z.object({
  '3d': z.number(),
  '1w': z.number(),
  '2w': z.number(),
  '1m': z.number(),
  '2m': z.number(),
  '3m': z.number(),
  '6m': z.number(),
  'flexible': z.number(),
});

const envSchema = z.object({
  // FACEBOOK_ACCESS_TOKEN: z.string().min(1, 'Facebook access token is required'),
  PLATFORM_RATES: platformRatesSchema.default({
    YOUTUBE: 5,
    FACEBOOK: 3,
    TIKTOK: 4,
    INSTAGRAM: 6,
  }),
  DEADLINE_MULTIPLIERS: deadlineMultipliersSchema.default({
    '3d': 2,
    '1w': 1.5,
    '2w': 1.2,
    '1m': 1,
    '2m': 0.9,
    '3m': 0.85,
    '6m': 0.8,
    'flexible': 0.75,
  }),
  SERVICE_FEE_PERCENTAGE: z.number().default(0.1),
});

function getEnvVars() {
  const env = {
    // FACEBOOK_ACCESS_TOKEN: process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN,
    PLATFORM_RATES: process.env.NEXT_PUBLIC_PLATFORM_RATES ? 
      JSON.parse(process.env.NEXT_PUBLIC_PLATFORM_RATES) : undefined,
    DEADLINE_MULTIPLIERS: process.env.NEXT_PUBLIC_DEADLINE_MULTIPLIERS ?
      JSON.parse(process.env.NEXT_PUBLIC_DEADLINE_MULTIPLIERS) : undefined,
    SERVICE_FEE_PERCENTAGE: process.env.NEXT_PUBLIC_SERVICE_FEE_PERCENTAGE ? 
      parseFloat(process.env.NEXT_PUBLIC_SERVICE_FEE_PERCENTAGE) : undefined,
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