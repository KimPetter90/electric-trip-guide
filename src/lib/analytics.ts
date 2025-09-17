// Mock analytics implementation
// In a real implementation, this would integrate with a proper analytics service

export interface AnalyticsData {
  visitors: { date: string; count: number }[];
  pageviews: { date: string; count: number }[];
  totalVisitors: number;
  totalPageviews: number;
}

// Mock data generator for demonstration
export function generateMockAnalytics(startDate: Date, endDate: Date): AnalyticsData {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const visitors: { date: string; count: number }[] = [];
  const pageviews: { date: string; count: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate realistic but random data
    const visitorCount = Math.floor(Math.random() * 20) + 1; // 1-20 visitors per day
    const pageviewCount = visitorCount + Math.floor(Math.random() * visitorCount * 2); // 1-3 pages per visitor
    
    visitors.push({
      date: date.toISOString().split('T')[0],
      count: visitorCount
    });

    pageviews.push({
      date: date.toISOString().split('T')[0],
      count: pageviewCount
    });
  }

  return {
    visitors,
    pageviews,
    totalVisitors: visitors.reduce((sum, item) => sum + item.count, 0),
    totalPageviews: pageviews.reduce((sum, item) => sum + item.count, 0)
  };
}

// Function to simulate real analytics API call
export async function fetchAnalytics(startDate: string, endDate: string): Promise<AnalyticsData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return generateMockAnalytics(start, end);
}