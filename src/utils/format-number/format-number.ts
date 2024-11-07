import {i18nInstance, makeInstance} from './i18n/i18n';
import type {FormatNumberOptions, FormatOptions} from './types';

import en from './i18n/en.json';
import ru from './i18n/ru.json';

const i18n = makeInstance('chartkit-units', {ru, en});

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

const unitFormatter = ({
    exponent,
    unitsI18nKeys,
    unitDelimiterI18nKey,
}: {
    exponent: number;
    unitsI18nKeys: string[];
    unitDelimiterI18nKey: string;
}) => {
    return function formatUnit(value: number, options: FormatOptions = {}) {
        const {precision, unitRate, showRankDelimiter = true, lang} = options;

        const i18nLang = i18nInstance.lang as string;
        if (lang) {
            i18nInstance.setLang(lang);
        }

        const resultUnitRate =
            typeof unitRate === 'number' ? unitRate : getUnitRate(value, exponent, unitsI18nKeys);

        let result: number | string = value / Math.pow(exponent, resultUnitRate);
        if (typeof precision === 'number') {
            result = Number(result.toFixed(precision));
        } else if (precision === 'auto' && result % 1 !== 0) {
            result = Number(result.toFixed(Math.abs(result) > 1 ? 2 : 4));
        }

        result = new Intl.NumberFormat(lang ?? i18nLang, {
            minimumFractionDigits: typeof precision === 'number' ? precision : 0,
            maximumFractionDigits: 20,
            useGrouping: showRankDelimiter,
        }).format(result);

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

export const getNumberUnitRate = (value: number) =>
    getUnitRate(value, 1000, BASE_NUMBER_FORMAT_UNIT_KEYS);

const NUMBER_UNIT_RATE_BY_UNIT = {
    default: 0,
    auto: undefined,
    k: 1,
    m: 2,
    b: 3,
    t: 4,
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
        unitRate,
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

    const formattedValue = baseFormatNumber(Number(value) * changedMultiplier, {
        ...options,
        unitRate: unitRate ?? NUMBER_UNIT_RATE_BY_UNIT[unit ?? 'default'],
    });

    return `${prefix}${formattedValue}${prePostfix}${postfix}`;
};
