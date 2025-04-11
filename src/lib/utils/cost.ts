import { Database } from "@/types/database.types";
import { parseViewCount } from './views';

const PLATFORM_RATES = {
  'YOUTUBE': 5, // $5 per 1000 views
  'FACEBOOK': 3,
  'TIKTOK': 4,
  'INSTAGRAM': 6
} as const;

const DEADLINE_MULTIPLIERS = {
  '3d': 2, // 2x for urgent delivery
  '1w': 1.5,
  '2w': 1.2,
  '1m': 1,
  '2m': 0.9,
  '3m': 0.85,
  '6m': 0.8,
  'flexible': 0.75
} as const;

const SERVICE_FEE_PERCENTAGE = 0.1; // 10% service fee

export function calculateCostClient(
  platform: keyof typeof PLATFORM_RATES,
  views: string | number,
  deadline: keyof typeof DEADLINE_MULTIPLIERS,
  includeServiceFee: boolean = true
): { baseCost: number; serviceFee: number; totalCost: number } {
  const viewCount = typeof views === 'string' ? parseViewCount(views) : views;
  const baseRate = PLATFORM_RATES[platform];
  const deadlineMultiplier = DEADLINE_MULTIPLIERS[deadline];
  const viewsInThousands = viewCount / 1000;
  
  const baseCost = Math.round(viewsInThousands * baseRate * deadlineMultiplier);
  const serviceFee = includeServiceFee ? Math.round(baseCost * SERVICE_FEE_PERCENTAGE) : 0;
  const totalCost = baseCost + serviceFee;

  return { baseCost, serviceFee, totalCost };
}