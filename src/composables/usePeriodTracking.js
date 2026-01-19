import { differenceInDays, addDays, formatISO, isWithinInterval, startOfDay } from 'date-fns';

/**
 * Calculates cycle statistics (min, max, average) from a history of period records.
 * @param {{start: string, end:string}[]} history - An array of period records.
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

  if (cycleLengths.length === 0) {
    return { average: 28, min: 28, max: 28 };
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
    if (history.length === 0) {
        return { average: 5, min: 5, max: 5 }; // Default stats
    }

    const durations = history.map(record => {
        return differenceInDays(new Date(record.end), new Date(record.start)) + 1;
    });

    const totalDuration = durations.reduce((acc, duration) => acc + duration, 0);
    const average = Math.round(totalDuration / durations.length);
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return { average, min, max };
}


/**
 * Predicts future period intervals based on history and an optional ongoing period.
 * @param {{start: string, end: string}[]} history - An array of period records.
 * @param {{start: string} | null} ongoingPeriod - The currently ongoing period.
 * @param {number} count - The number of future periods to predict.
 * @returns {{start: string, end: string}[]} An array of predicted period intervals.
 */
export function predictFuturePeriods(history, ongoingPeriod, count = 2) {
  const combinedHistory = ongoingPeriod 
    ? [...history, { start: ongoingPeriod.start, end: ongoingPeriod.start }] 
    : [...history];

  if (combinedHistory.length === 0) {
    return [];
  }

  const cycleStats = calculateCycleStats(combinedHistory);
  const durationStats = calculateDurationStats(history);
  const sortedHistory = combinedHistory.sort((a, b) => new Date(a.start) - new Date(b.start));
  let lastStartDate = new Date(sortedHistory[sortedHistory.length - 1].start);

  const predictions = [];
  for (let i = 0; i < count; i++) {
    const nextStartDate = addDays(lastStartDate, cycleStats.average);
    const nextEndDate = addDays(nextStartDate, durationStats.average - 1);
    
    predictions.push({
      start: formatISO(nextStartDate, { representation: 'date' }),
      end: formatISO(nextEndDate, { representation: 'date' }),
    });

    lastStartDate = nextStartDate;
  }

  return predictions;
}

/**
 * Determines the period status for a given day.
 * @param {string} date - The ISO date string for the date to check.
 * @param {{start: string, end: string}[]} history - An array of completed period records.
 * @param {{start: string} | null} ongoingPeriod - The currently ongoing period.
 * @returns {{status: 'actual' | 'ongoing' | 'predicted' | 'none', dayCount: number | null}} The period status.
 */
export function getPeriodStatusForDate(date, history, ongoingPeriod) {
  const targetDate = startOfDay(new Date(date));

  // 1. Check for completed, historical periods
  for (const record of history) {
    const start = startOfDay(new Date(record.start));
    const end = startOfDay(new Date(record.end));
    if (isWithinInterval(targetDate, { start, end })) {
      return {
        status: 'actual',
        dayCount: differenceInDays(targetDate, start) + 1,
      };
    }
  }

  // 2. Check for an ongoing period and its predicted duration
  if (ongoingPeriod) {
    const durationStats = calculateDurationStats(history);
    const start = startOfDay(new Date(ongoingPeriod.start));
    const projectedEnd = addDays(start, durationStats.average - 1);
    
    if (isWithinInterval(targetDate, { start, end: projectedEnd })) {
      return {
        status: 'ongoing',
        dayCount: differenceInDays(targetDate, start) + 1,
      };
    }
  }

  // 3. Check for future predicted periods
  const futurePredictions = predictFuturePeriods(history, ongoingPeriod, 2);
  for (const prediction of futurePredictions) {
    const start = startOfDay(new Date(prediction.start));
    const end = startOfDay(new Date(prediction.end));
    if (isWithinInterval(targetDate, { start, end })) {
      return {
        status: 'predicted',
        dayCount: differenceInDays(targetDate, start) + 1,
      };
    }
  }

  // 4. If none of the above, no status
  return { status: 'none', dayCount: null };
}

/**
 * Checks if a proactive notification for an upcoming period should be sent.
 * @param {string} date - The ISO date string for the current date.
 * @param {{start: string, end: string}[]} history - An array of completed period records.
 * @param {{start: string} | null} ongoingPeriod - The currently ongoing period.
 * @returns {{daysUntil: number, startDate: string} | null} Notification info or null.
 */
export function getPeriodNotificationStatus(date, history, ongoingPeriod) {
  const now = startOfDay(new Date(date));
  const futurePredictions = predictFuturePeriods(history, ongoingPeriod, 1);

  if (futurePredictions.length > 0) {
    const nextPrediction = futurePredictions[0];
    const nextStartDate = startOfDay(new Date(nextPrediction.start));
    const daysUntil = differenceInDays(nextStartDate, now);

    // The character knows 3 days in advance
    if (daysUntil >= 0 && daysUntil <= 3) {
      return {
        daysUntil: daysUntil,
        startDate: nextPrediction.start,
      };
    }
  }

  return null;
}
