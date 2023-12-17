// To help with the chart

// Contains all the chart filters we want to use
export const chartConfig = {
  "1D": { resolution: "1", days: 1, weeks: 0, months: 0, years: 0 },
  "1W": { resolution: "15", days: 0, weeks: 1, months: 0, years: 0 },
  "1M": { resolution: "15", days: 0, weeks: 0, months: 1, years: 0 },
  "1Y": { resolution: "15", days: 0, weeks: 0, months: 0, years: 1 }, // previously, resolution was D
};