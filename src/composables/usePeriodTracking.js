import { differenceInDays, addDays, formatISO, isWithinInterval } from 'date-fns';

/**
 * Calculates cycle statistics (min, max, average) from a history of period records.
 * @param {{start: string, end: string}[]} history - An array of period records.
 * @returns {{average: number, min: number, max: number}} The cycle statistics.
 */
export function calculateCycleStats(history) {
  if (history.length < 2) {
    return { average: 28, min: 28, max: 28 }; // Default stats
  }

  const sortedHistory = [...history].sort((a, b) => new Date(a.start) - new Date(b.start));
  const cycleLengths = [];
  for (let i = 1; i < sortedHistory.length; i++) {
    const date1 = new Date(sortedHistory[i - 1].start);
    const date2 = new Date(sortedHistory[i].start);
    cycleLengths.push(differenceInDays(date2, date1));
  }

  const totalDifference = cycleLengths.reduce((acc, length) => acc + length, 0);
  const average = Math.round(totalDifference / cycleLengths.length);
  const min = Math.min(...cycleLengths);
  const max = Math.max(...cycleLengths);

  return { average, min, max };
}

/**
 * Calculates duration statistics (min, max, average) of periods from a history of records.
 * @param {{start: string, end: string}[]} history - An array of period records.
 * @returns {{average: number, min: number, max: number}} The duration statistics.
 */
export function calculateDurationStats(history) {
    // Filter out ongoing periods (where start date equals end date) before calculation
    const completedPeriods = history.filter(record => record.start !== record.end);

    if (completedPeriods.length === 0) {
        return { average: 5, min: 5, max: 5 }; // Default stats if no completed periods
    }

    const durations = completedPeriods.map(record => {
        return differenceInDays(new Date(record.end), new Date(record.start)) + 1;
    });

    const totalDuration = durations.reduce((acc, duration) => acc + duration, 0);
    const average = Math.round(totalDuration / completedPeriods.length);
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return { average, min, max };
}


/**
 * Predicts the next period interval based on history.
 * @param {{start: string, end: string}[]} history - An array of period records.
 * @returns {{startDate: string, endDate: string}} The predicted start and end dates of the interval.
 */
export function predictNextPeriod(history) {
  const cycleStats = calculateCycleStats(history);
  const durationStats = calculateDurationStats(history);
  const lastRecord = history.sort((a, b) => new Date(a.start) - new Date(b.start))[history.length - 1];
  
  const lastDate = new Date(lastRecord.start);
  
  // The predicted interval starts from the earliest possible start date
  const earliestStartDate = addDays(lastDate, cycleStats.min);

  // And ends after the latest possible start date plus the longest possible duration
  const latestStartDate = addDays(lastDate, cycleStats.max);
  const latestEndDate = addDays(latestStartDate, durationStats.max - 1);

  return {
    startDate: formatISO(earliestStartDate, { representation: 'date' }),
    endDate: formatISO(latestEndDate, { representation: 'date' }),
  };
}

/**
 * Determines the period status for a given day.
 * @param {string} date - The ISO date string for the date to check.
 * @param {{start: string, end: string}[]} history - An array of period records.
 * @returns {{status: 'actual' | 'predicted' | 'none', dayCount: number | null}} The period status.
 */
export function getPeriodStatusForDate(date, history) {
  const targetDate = new Date(date);

  // 1. Check if the date is within any actual recorded period
  for (const record of history) {
    const start = new Date(record.start);
    const end = new Date(record.end);
    if (isWithinInterval(targetDate, { start, end })) {
      return {
        status: 'actual',
        dayCount: differenceInDays(targetDate, start) + 1,
      };
    }
  }

  // 2. If not, check for prediction
  if (history.length > 0) {
    const prediction = predictNextPeriod(history);
    const predictedStartDate = new Date(prediction.startDate);
    const predictedEndDate = new Date(prediction.endDate);

    // Check if the date is within the predicted range
    if (isWithinInterval(targetDate, { start: predictedStartDate, end: predictedEndDate })) {
        const dayOfPrediction = differenceInDays(targetDate, predictedStartDate) + 1;
        return {
            status: 'predicted',
            dayCount: dayOfPrediction,
        };
    }
    
    // Check if the date is before the predicted start date
    const daysUntilPrediction = differenceInDays(predictedStartDate, targetDate);
    if (daysUntilPrediction > 0) {
        return {
            status: 'predicted',
            dayCount: daysUntilPrediction, // "预计 X 天后"
        };
    }
  }

  // 3. If none of the above, no status
  return { status: 'none', dayCount: null };
}
