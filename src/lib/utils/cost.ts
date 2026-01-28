import { Database } from "@/types/database.types";
import { parseViewCount } from './views';
import { env } from '../env';

// Type-safe access to the platform rates and deadline multipliers
const PLATFORM_RATES = env.PLATFORM_RATES;
const DEADLINE_MULTIPLIERS = env.DEADLINE_MULTIPLIERS;
const SERVICE_FEE_PERCENTAGE = env.SERVICE_FEE_PERCENTAGE;
const ESTIMATED_PROFIT_PERCENTAGE = env.ESTIMATED_PROFIT_PERCENTAGE;

export function calculateCostClient(
  platform: keyof typeof PLATFORM_RATES,
  views: string | number,
  deadline: keyof typeof DEADLINE_MULTIPLIERS,
  includeServiceFee: boolean = true
): { baseCost: number; serviceFee: number; totalCost: number; estimatedProfit: number } {
  const viewCount = typeof views === 'string' ? parseViewCount(views) : views;
  const baseRate = PLATFORM_RATES[platform];
  const deadlineMultiplier = DEADLINE_MULTIPLIERS[deadline];
  const viewsInThousands = viewCount / 1000;
  
  const baseCost = Math.round(viewsInThousands * baseRate * deadlineMultiplier);
  const serviceFee = includeServiceFee ? Math.round(baseCost * SERVICE_FEE_PERCENTAGE) : 0;
  const totalCost = baseCost + serviceFee;
  
  // Calculate estimated profit as 37% of the base cost (without service fee)
  const estimatedProfit = Math.round(baseCost * ESTIMATED_PROFIT_PERCENTAGE);

  return { baseCost, serviceFee, totalCost, estimatedProfit };
}