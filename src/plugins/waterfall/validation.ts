import {CHART_ERROR_CODE, ChartError} from '../../libs';
import type {ValueFormat, WaterfallSeries} from '../../types';
import {validateBarLabelPlacement} from '../bar-label-placement';

function invalid(message: string): never {
    throw new ChartError({code: CHART_ERROR_CODE.INVALID_DATA, message: `waterfall.${message}`});
}

function validateObject(value: unknown, path: string) {
    if (
        value !== undefined &&
        (typeof value !== 'object' || value === null || Array.isArray(value))
    ) {
        invalid(`${path} must be an object`);
    }
}

function validateEnabled(options: {enabled?: boolean} | undefined, path: string) {
    validateObject(options, path);
    if (options?.enabled !== undefined && typeof options.enabled !== 'boolean') {
        invalid(`${path}.enabled must be a boolean`);
    }
}

function validateString(value: unknown, path: string) {
    if (value !== undefined && typeof value !== 'string') invalid(`${path} must be a string`);
}

function validateFormat(format: ValueFormat | undefined, path: string) {
    validateObject(format, path);
    if (format === undefined) return;
    switch (format.type) {
        case 'number':
            return;
        case 'date':
            validateString(format.format, `${path}.format`);
            return;
        case 'custom':
            if (typeof format.formatter !== 'function')
                invalid(`${path}.formatter must be a function`);
            return;
        default:
            invalid(`${path}.type must be "number", "date", or "custom"`);
    }
}

export function validateWaterfallSeries(series: WaterfallSeries) {
    validateBarLabelPlacement(series.dataLabels);
    validateEnabled(series.connectors, 'connectors');

    const {subtotal} = series;
    validateObject(subtotal, 'subtotal');
    if (subtotal) {
        validateString(subtotal.name, 'subtotal.name');
        validateString(subtotal.color, 'subtotal.color');
        validateEnabled(subtotal.legend, 'subtotal.legend');
        validateString(subtotal.legend?.itemText, 'subtotal.legend.itemText');
        validateEnabled(subtotal.tooltip, 'subtotal.tooltip');
        validateFormat(subtotal.tooltip?.valueFormat, 'subtotal.tooltip.valueFormat');
        validateEnabled(subtotal.dataLabels, 'subtotal.dataLabels');
        validateFormat(subtotal.dataLabels?.format, 'subtotal.dataLabels.format');
    }

    series.data.forEach(({role, total}, index) => {
        if (role === undefined) return;
        if (role !== 'change' && role !== 'subtotal' && role !== 'total') {
            invalid(`data[${index}].role must be "change", "subtotal", or "total"`);
        }
        if (total !== undefined && total !== (role === 'total')) {
            invalid(`data[${index}].role conflicts with total`);
        }
    });
}
