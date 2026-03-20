export const TIME_UNITS = {
    millisecond: 1,
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 24 * 3600000,
    week: 7 * 24 * 3600000,
    month: 28 * 24 * 3600000,
    year: 364 * 24 * 3600000,
} as const;

export type TimeUnit = keyof typeof TIME_UNITS;

export const DATETIME_LABEL_FORMATS: Record<TimeUnit, string> = {
    millisecond: 'DD.MM.YY HH:mm:ss.SSS',
    second: 'DD.MM.YY HH:mm:ss',
    minute: 'DD.MM.YY HH:mm',
    hour: 'DD.MM.YY HH:mm',
    day: 'DD.MM.YY',
    week: 'DD.MM.YY',
    month: "MMM 'YY",
    year: 'YYYY',
};

export type DateTimeLabelFormats = Partial<Record<TimeUnit, string>>;

function getTimeUnit(range: number): TimeUnit {
    const units = Object.keys(TIME_UNITS) as TimeUnit[];
    const index = units.findIndex((unit) => range < TIME_UNITS[unit]);
    return index === -1 ? 'year' : units[index - 1];
}

export function getDefaultDateFormat(range?: number, overrides?: DateTimeLabelFormats) {
    const formats = {...DATETIME_LABEL_FORMATS, ...overrides};

    if (range) {
        const unit = getTimeUnit(range);

        if (unit in formats) {
            return formats[unit as keyof typeof formats];
        }
    }

    return formats.day;
}

export function getDefaultTimeOnlyFormat(step: number): string {
    if (step < TIME_UNITS.second) {
        return 'HH:mm:ss.SSS';
    }

    if (step < TIME_UNITS.minute) {
        return 'HH:mm:ss';
    }

    return 'HH:mm';
}
