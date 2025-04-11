interface CostFactors {
  baseRate: number;     // Cost per thousand views
  platformMultiplier: number;  // Platform-specific multiplier
  timeMultiplier: number;     // Deadline-based multiplier
}

const platformRates: Record<string, number> = {
  'YOUTUBE': 1.2,
  'FACEBOOK': 1.0,
  'INSTAGRAM': 1.1,
  'TIKTOK': 1.3
};

const timeFactors: Record<string, number> = {
  '3d': 2.0,    // 3 days - urgent
  '1w': 1.5,    // 1 week
  '2w': 1.2,    // 2 weeks
  '1m': 1.0,    // 1 month - baseline
  '2m': 0.9,    // 2 months
  '3m': 0.8,    // 3 months
  '6m': 0.7,    // 6 months
  'flexible': 0.6  // Flexible timeline
};

export function calculateCost(views: number, platform: string, timeframe: string): number {
  const baseRate = 2; // $2 per thousand views baseline
  const platformMultiplier = platformRates[platform] || 1;
  const timeMultiplier = timeFactors[timeframe] || 1;

  // Calculate base cost per thousand views
  const costPer1k = baseRate * platformMultiplier * timeMultiplier;
  
  // Calculate total cost
  const totalCost = Math.round((views / 1000) * costPer1k);
  
  return totalCost;
}