import {i18nInstance, makeInstance} from './i18n/i18n';
import type {
    FormatNumberOptions,
    FormatOptions,
    FormatUnitScale,
    FormatUnitScaleEntry,
} from './types';

import en from './i18n/en.json';
import ru from './i18n/ru.json';

const i18n = makeInstance('units', {ru, en});

function getUnitRate(value: number, exponent: number, unitsI18nKeys: string[]) {
    let resultUnitRate = 1;
    while (
        Math.abs(value / Math.pow(exponent, resultUnitRate)) >= 1 &&
        resultUnitRate < 10 &&
        i18n(unitsI18nKeys[resultUnitRate])
    ) {
        resultUnitRate++;
    }

    return resultUnitRate - 1;
}

const formatScaledNumber = (
    value: number,
    options: Pick<FormatOptions, 'precision' | 'showRankDelimiter' | 'lang'>,
): string => {
    const {precision, showRankDelimiter = true, lang} = options;

    let result: number = value;

    if (typeof precision === 'number') {
        result = Number(result.toFixed(precision));
    } else if (precision === 'auto' && result % 1 !== 0) {
        result = Number(result.toFixed(Math.abs(result) > 1 ? 2 : 4));
    }

    return new Intl.NumberFormat(lang ?? (i18nInstance.lang as string), {
        minimumFractionDigits: typeof precision === 'number' ? precision : 0,
        maximumFractionDigits: 20,
        useGrouping: showRankDelimiter,
    }).format(result);
};

const unitFormatter = ({
    exponent,
    unitsI18nKeys,
    unitDelimiterI18nKey,
}: {
    exponent: number;
    unitsI18nKeys: string[];
    unitDelimiterI18nKey: string;
}) => {
    return function formatUnit(value: number, options: FormatOptions & {unitRate?: number} = {}) {
        const {unitRate, lang} = options;

        const i18nLang = i18nInstance.lang as string;
        if (lang) {
            i18nInstance.setLang(lang);
        }

        const resultUnitRate =
            typeof unitRate === 'number' ? unitRate : getUnitRate(value, exponent, unitsI18nKeys);

        const result = formatScaledNumber(value / Math.pow(exponent, resultUnitRate), options);

        const unit = i18n(unitsI18nKeys[resultUnitRate]);
        const delimiter = i18n(unitDelimiterI18nKey);

        i18nInstance.setLang(i18nLang);

        return `${result}${delimiter}${unit}`;
    };
};

export const formatBytes = unitFormatter({
    exponent: 1024,
    unitDelimiterI18nKey: 'value_space-delimiter',
    unitsI18nKeys: ['value_short-bytes', 'value_short-kilobytes', 'value_short-megabytes'],
});

export const formatDuration = unitFormatter({
    exponent: 1000,
    unitDelimiterI18nKey: 'value_space-delimiter',
    unitsI18nKeys: ['value_short-milliseconds', 'value_short-seconds', 'value_short-minutes'],
});

const BASE_NUMBER_FORMAT_UNIT_KEYS = [
    'value_short-empty',
    'value_short-k',
    'value_short-m',
    'value_short-b',
    'value_short-t',
];

const baseFormatNumber = unitFormatter({
    exponent: 1000,
    unitDelimiterI18nKey: 'value_number-delimiter',
    unitsI18nKeys: BASE_NUMBER_FORMAT_UNIT_KEYS,
});

const FALLBACK_UNIT_ENTRY: FormatUnitScaleEntry = {factor: 1, postfix: ''};

const normalizedUnitsCache = new WeakMap<FormatUnitScale, FormatUnitScaleEntry[]>();

const normalizeUnits = (units: FormatUnitScale): FormatUnitScaleEntry[] => {
    const cached = normalizedUnitsCache.get(units);

    if (cached) {
        return cached;
    }

    const {scale} = units;
    const rawEntries = Array.isArray(scale)
        ? scale.map((e) => ({factor: e.factor, postfix: e.postfix}))
        : scale.postfixes.map((postfix, i) => ({factor: Math.pow(scale.base, i), postfix}));

    const valid = rawEntries.filter((e) => Number.isFinite(e.factor) && e.factor > 0);
    valid.sort((a, b) => a.factor - b.factor);

    const deduped: FormatUnitScaleEntry[] = [];

    for (const e of valid) {
        if (deduped.length === 0 || deduped[deduped.length - 1].factor !== e.factor) {
            deduped.push(e);
        }
    }

    const result = deduped.length > 0 ? deduped : [FALLBACK_UNIT_ENTRY];
    normalizedUnitsCache.set(units, result);

    return result;
};

const pickUnitEntry = (value: number, scale: FormatUnitScaleEntry[]): FormatUnitScaleEntry => {
    const av = Math.abs(value);
    let chosen = scale[0];

    for (const e of scale) {
        if (av / e.factor >= 1) {
            chosen = e;
        } else {
            break;
        }
    }

    return chosen;
};

const customUnitFormatter = (
    value: number,
    units: FormatUnitScale,
    options: FormatNumberOptions,
): string => {
    const {lang} = options;

    const i18nLang = i18nInstance.lang as string;

    if (lang) {
        i18nInstance.setLang(lang);
    }

    const normalizedScale = normalizeUnits(units);
    const entry = pickUnitEntry(value, normalizedScale);
    const result = formatScaledNumber(value / entry.factor, options);
    const resolvedDelimiter =
        typeof units.delimiter === 'string' ? units.delimiter : i18n('value_space-delimiter');
    const delimiter = entry.postfix ? resolvedDelimiter : '';

    i18nInstance.setLang(i18nLang);

    return `${result}${delimiter}${entry.postfix}`;
};

const NUMBER_UNIT_RATE_BY_UNIT = {
    default: 0,
    auto: undefined,
    k: 1,
    m: 2,
    b: 3,
    t: 4,
};

export const getDefaultUnit = (value: number) => {
    const unitRate = getUnitRate(value, 1000, BASE_NUMBER_FORMAT_UNIT_KEYS);
    const [unit] =
        Object.entries(NUMBER_UNIT_RATE_BY_UNIT).find(([_key, val]) => val === unitRate) ?? [];
    return unit;
};

export const formatNumber = (value: number | string, options: FormatNumberOptions = {}) => {
    if (Number.isNaN(value) || Number.isNaN(Number(value))) {
        return new Intl.NumberFormat('en').format(Number(value));
    }

    const {
        format = 'number',
        multiplier = 1,
        prefix = '',
        postfix = '',
        unit,
        units,
        labelMode,
    } = options;

    let changedMultiplier = multiplier;
    let prePostfix = '';

    if (format === 'percent') {
        changedMultiplier = 100;
        prePostfix = '%';
    }

    if (labelMode === 'percent') {
        prePostfix = '%';
    }

    if (units) {
        const formattedValue = customUnitFormatter(
            Number(value) * changedMultiplier,
            units,
            options,
        );

        return `${prefix}${formattedValue}${prePostfix}${postfix}`;
    }

    const formattedValue = baseFormatNumber(Number(value) * changedMultiplier, {
        ...options,
        unitRate: NUMBER_UNIT_RATE_BY_UNIT[unit ?? 'default'],
    });

    return `${prefix}${formattedValue}${prePostfix}${postfix}`;
};
