import {AXIS_TYPE} from '../constants';
import {i18n} from '../i18n';
import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {ChartAxis, ChartXAxis, ChartYAxis} from '../types';

const AVAILABLE_AXIS_TYPES = Object.values(AXIS_TYPE);

function validateCategories(axis: ChartAxis) {
    if (!axis.categories || !Array.isArray(axis.categories) || axis.categories.length === 0) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-axis-categories'),
        });
    }
}

function validateDuplicateCategories({
    axisIndex,
    key,
    categories = [],
}: {
    axisIndex: number;
    key: 'x' | 'y';
    categories?: string[];
}) {
    const seen = new Set<string>();

    categories.forEach((category) => {
        if (seen.has(category)) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_duplicate-axis-categories', {
                    key,
                    axisIndex,
                    duplicate: category,
                }),
            });
        }
        seen.add(category);
    });
}

function validateAxisType({axis, key}: {axis: ChartAxis; key: 'x' | 'y'}) {
    if (axis.type && !AVAILABLE_AXIS_TYPES.includes(axis.type)) {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-axis-type', {
                key,
                values: AVAILABLE_AXIS_TYPES,
            }),
        });
    }
}

function validateLabelsHtmlOptions(args: {axis: ChartAxis}) {
    const {axis} = args;
    const html = axis.labels?.html;

    if (typeof html === 'undefined') {
        return;
    }

    if (typeof html !== 'boolean') {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-axis-labels-html-type'),
        });
    }

    if (html && axis.type !== 'category') {
        throw new ChartError({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: i18n('error', 'label_invalid-axis-labels-html-not-supported-axis-type'),
        });
    }
}

export function validateAxes(args: {xAxis?: ChartXAxis; yAxis?: ChartYAxis[]}) {
    const {xAxis, yAxis = []} = args;

    if (xAxis) {
        validateAxisType({axis: xAxis, key: 'x'});
        validateLabelsHtmlOptions({axis: xAxis});

        if (xAxis?.type === 'category') {
            validateCategories(xAxis);
            validateDuplicateCategories({
                categories: xAxis.categories,
                key: 'x',
                axisIndex: 0,
            });
        }
    }

    yAxis.forEach((axis, axisIndex) => {
        validateAxisType({axis, key: 'y'});
        if (axis.type === 'category') {
            validateCategories(axis);
            validateDuplicateCategories({
                categories: axis.categories,
                key: 'y',
                axisIndex,
            });
        }
        validateLabelsHtmlOptions({axis});
    });
}
