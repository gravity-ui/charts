import {bisector, tickStep} from 'd3-array';
import {
    utcDay,
    utcHour,
    utcMillisecond,
    utcMinute,
    utcMonth,
    utcSecond,
    utcMonday as utcWeek,
    utcYear,
} from 'd3-time';
import type {CountableTimeInterval} from 'd3-time';

import {DAY, HOUR, MINUTE, MONTH, SECOND, WEEK, YEAR} from '../../constants';
import type {DateTimeLabelFormats} from '../time';

type TickInterval = [CountableTimeInterval, number, number];

// Base tick intervals matching the original D3 utcTicks algorithm
// (with Monday-start weeks). Extra granularities live in optionalTickIntervals
// and are injected only when the matching dateTimeLabelFormats key is provided.
const baseTickIntervals: TickInterval[] = [
    [utcSecond, 1, SECOND],
    [utcSecond, 5, 5 * SECOND],
    [utcSecond, 15, 15 * SECOND],
    [utcSecond, 30, 30 * SECOND],
    [utcMinute, 1, MINUTE],
    [utcMinute, 5, 5 * MINUTE],
    [utcMinute, 15, 15 * MINUTE],
    [utcMinute, 30, 30 * MINUTE],
    [utcHour, 1, HOUR],
    [utcHour, 3, 3 * HOUR],
    [utcHour, 6, 6 * HOUR],
    [utcHour, 12, 12 * HOUR],
    [utcDay, 1, DAY],
    [utcDay, 2, 2 * DAY],
    [utcWeek, 1, WEEK],
    [utcMonth, 1, MONTH],
    [utcMonth, 3, 3 * MONTH],
    [utcYear, 1, YEAR],
];

const optionalTickIntervals: Partial<Record<keyof DateTimeLabelFormats, TickInterval>> = {
    halfYear: [utcMonth, 6, 6 * MONTH],
};

function buildTickIntervals(formats?: DateTimeLabelFormats): TickInterval[] {
    if (!formats) {
        return baseTickIntervals;
    }

    const extras = Object.keys(formats).flatMap((key) => {
        const entry = optionalTickIntervals[key as keyof DateTimeLabelFormats];
        return entry ? [entry] : [];
    });

    if (extras.length === 0) {
        return baseTickIntervals;
    }

    return [...baseTickIntervals, ...extras].sort((a, b) => a[2] - b[2]);
}

function getDateTimeTickInterval(
    start: number,
    stop: number,
    count: number,
    formats?: DateTimeLabelFormats,
) {
    const intervals = buildTickIntervals(formats);
    const target = Math.abs(stop - start) / count;
    const i = bisector(([, , step]) => step).right(intervals, target);

    if (i === intervals.length) {
        return utcYear.every(tickStep(start / YEAR, stop / YEAR, count));
    }

    if (i === 0) {
        return utcMillisecond.every(Math.max(tickStep(start, stop, count), 1));
    }

    const [t, step] =
        intervals[target / intervals[i - 1][2] < intervals[i][2] / target ? i - 1 : i];
    return t.every(step);
}

/**
 * Generates time ticks for the given interval.
 *
 * Based on d3's utcTicks algorithm (https://github.com/d3/d3-time/blob/main/src/ticks.js) with one modification:
 * weeks are considered to start on Monday (ISO 8601 standard)
 * instead of Sunday (d3 default).
 */
export function getDateTimeTicks(
    start: Date,
    stop: Date,
    count = 10,
    formats?: DateTimeLabelFormats,
) {
    const reverse = stop < start;
    if (reverse) {
        [start, stop] = [stop, start];
    }

    const interval = getDateTimeTickInterval(start.getTime(), stop.getTime(), count, formats);
    const ticks = interval ? interval.range(start, new Date(Number(stop) + 1)) : [];
    return reverse ? ticks.reverse() : ticks;
}
