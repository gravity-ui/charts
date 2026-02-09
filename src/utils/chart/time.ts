import type {CountableTimeInterval} from 'd3';
import {
    utcDay,
    utcHour,
    utcMillisecond,
    utcMinute,
    utcMonth,
    utcSecond,
    utcWeek,
    utcYear,
} from 'd3';

export const TIME_UNITS: Record<string, number> = {
    millisecond: 1,
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 24 * 3600000,
    week: 7 * 24 * 3600000,
    month: 28 * 24 * 3600000,
    year: 364 * 24 * 3600000,
};

export const DATETIME_LABEL_FORMATS: Record<keyof typeof TIME_UNITS, string> = {
    millisecond: 'DD.MM.YY HH:mm:ss.SSS',
    second: 'DD.MM.YY HH:mm:ss',
    minute: 'DD.MM.YY HH:mm',
    hour: 'DD.MM.YY HH:mm',
    day: 'DD.MM.YY',
    week: 'DD.MM.YY',
    month: "MMM 'YY",
    year: 'YYYY',
};

function getTimeUnit(range: number): keyof typeof TIME_UNITS {
    const units = Object.keys(TIME_UNITS);
    const index = units.findIndex((unit) => range < TIME_UNITS[unit]);
    return index === -1 ? 'year' : units[index - 1];
}

export function getDefaultDateFormat(range?: number) {
    if (range) {
        const unit = getTimeUnit(range);

        if (unit in DATETIME_LABEL_FORMATS) {
            return DATETIME_LABEL_FORMATS[unit];
        }
    }

    return DATETIME_LABEL_FORMATS.day;
}

/**
 * Time intervals ordered from largest to smallest.
 */
export const TIME_INTERVALS: Array<{
    interval: CountableTimeInterval;
    unit: keyof typeof TIME_UNITS;
    duration: number;
    labelCharCount: number;
    niceSteps?: number[];
}> = [
    {
        interval: utcMillisecond,
        unit: 'millisecond',
        duration: TIME_UNITS.millisecond,
        labelCharCount: DATETIME_LABEL_FORMATS.millisecond.length,
        niceSteps: [1, 2, 5, 10, 20, 50, 100, 200, 500],
    },
    {
        interval: utcSecond,
        unit: 'second',
        duration: TIME_UNITS.second,
        labelCharCount: DATETIME_LABEL_FORMATS.second.length,
        niceSteps: [1, 2, 5, 10, 15, 20, 30], // divisors of 60
    },
    {
        interval: utcMinute,
        unit: 'minute',
        duration: TIME_UNITS.minute,
        labelCharCount: DATETIME_LABEL_FORMATS.minute.length,
        niceSteps: [1, 2, 5, 10, 15, 20, 30], // divisors of 60
    },
    {
        interval: utcHour,
        unit: 'hour',
        duration: TIME_UNITS.hour,
        labelCharCount: DATETIME_LABEL_FORMATS.hour.length,
        niceSteps: [1, 2, 3, 4, 6, 8, 12], // divisors of 24
    },
    {
        interval: utcDay,
        unit: 'day',
        duration: TIME_UNITS.day,
        labelCharCount: DATETIME_LABEL_FORMATS.day.length,
        niceSteps: [1, 2],
    },
    {
        interval: utcWeek,
        unit: 'week',
        duration: TIME_UNITS.week,
        labelCharCount: DATETIME_LABEL_FORMATS.week.length,
        niceSteps: [1, 2],
    },
    {
        interval: utcMonth,
        unit: 'month',
        duration: TIME_UNITS.month,
        labelCharCount: DATETIME_LABEL_FORMATS.month.length,
        niceSteps: [1, 2, 3, 4, 6], // divisors of 12
    },
    {
        interval: utcYear,
        unit: 'year',
        duration: TIME_UNITS.year,
        labelCharCount: DATETIME_LABEL_FORMATS.year.length,
        // No niceSteps — any step is visually even for years
    },
];
