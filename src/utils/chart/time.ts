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
