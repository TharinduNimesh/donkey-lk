export function parseViewCount(viewString: string): number {
  const cleanStr = viewString.toUpperCase().trim();
  const value = parseFloat(cleanStr.replace(/[KM]/g, ''));
  
  if (cleanStr.endsWith('K')) {
    return value * 1000;
  } else if (cleanStr.endsWith('M')) {
    return value * 1000000;
  }
  return value;
}

export function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(views % 1000000 === 0 ? 0 : 1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(views % 1000 === 0 ? 0 : 1)}K`;
  }
  return views.toString();
}