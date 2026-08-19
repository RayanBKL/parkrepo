/**
 * Calculate the price based on parking billing settings and duration
 * @param {Date|string} arrivedAt - Entry time
 * @param {Date|string} exitedAt - Exit time
 * @param {Object} pricing - Parking pricing settings { hourlyRate: number, dailyRate: number, currency: string }
 * @returns {Object} - Result with amount, formatted, duration in ms
 */
export const calculatePrice = (arrivedAt, exitedAt, pricing) => {
  if (!arrivedAt || !exitedAt) return { amount: 0, formatted: "0.00", durationMs: 0, currency: pricing?.currency || "EUR" };
  
  const start = new Date(arrivedAt);
  const end = new Date(exitedAt);
  const durationMs = end.getTime() - start.getTime();
  
  if (durationMs <= 0) return { amount: 0, formatted: "0.00", durationMs: 0, currency: pricing?.currency || "EUR" };

  const hours = durationMs / (1000 * 60 * 60);
  
  let amount = 0;
  
  if (pricing?.hourlyRate > 0 || pricing?.dailyRate > 0) {
    const hourly = pricing.hourlyRate || 0;
    const daily = pricing.dailyRate || 0;

    // Simple calculation: if daily rate exists, convert to days, otherwise just hours
    if (daily > 0 && hours > 12) {
      const days = Math.ceil(hours / 24);
      amount = days * daily;
    } else {
      amount = Math.ceil(hours) * hourly;
    }
  }

  return {
    amount,
    formatted: amount.toFixed(2),
    durationMs,
    hours: parseFloat(hours.toFixed(2)),
    currency: pricing?.currency || "EUR"
  };
};
