import isEqual from 'lodash/isEqual';

import {DEFAULT_DATALABELS_STYLE} from '~core/constants';
import {i18n} from '~core/i18n';

import {CHART_ERROR_CODE, ChartError} from '../libs';
import type {AreaSeries, BarXSeries, BarYSeries, ChartSeries, StackLabelsOptions} from '../types';

function validateStackLabelsAggregation(aggregation: StackLabelsOptions['aggregation']) {
    if (aggregation === undefined || aggregation === 'sum' || typeof aggregation === 'function') {
        return;
    }

    throw new ChartError({
        code: CHART_ERROR_CODE.INVALID_DATA,
        message: i18n('error', 'label_invalid-series-property', {
            key: 'stackLabels.aggregation',
            values: 'sum or a function',
        }),
    });
}

export function resolveStackLabelsOptions(
    defaults?: StackLabelsOptions,
    overrides?: StackLabelsOptions,
): Required<Omit<StackLabelsOptions, 'format'>> & Pick<StackLabelsOptions, 'format'> {
    return {
        aggregation: overrides?.aggregation ?? defaults?.aggregation ?? 'sum',
        enabled: overrides?.enabled ?? defaults?.enabled ?? false,
        format: overrides?.format ?? defaults?.format,
        style: {...DEFAULT_DATALABELS_STYLE, ...defaults?.style, ...overrides?.style},
        padding: overrides?.padding ?? defaults?.padding ?? 5,
        allowOverlap: overrides?.allowOverlap ?? defaults?.allowOverlap ?? false,
    };
}

export function validateStackLabelsOptions(args: {
    series: BarXSeries | BarYSeries | AreaSeries;
    allSeries: ChartSeries[];
    options?: StackLabelsOptions;
}) {
    const {series, allSeries, options} = args;
    // Collection validation runs once per plugin, including initially hidden series.
    if (allSeries.find((item) => item.type === series.type) !== series) return;

    validateStackLabelsAggregation(options?.aggregation);
    const stacks = new Map<
        string,
        {name: string; options: ReturnType<typeof resolveStackLabelsOptions>}
    >();
    for (const item of allSeries) {
        if (item.type !== series.type) continue;
        const stacked = item as typeof series;
        validateStackLabelsAggregation(stacked.stackLabels?.aggregation);
        if (!stacked.stacking) continue;
        const resolved = resolveStackLabelsOptions(options, stacked.stackLabels);
        if (!resolved.enabled) continue;
        const axis = 'yAxis' in stacked ? (stacked.yAxis ?? 0) : 0;
        const key = JSON.stringify([axis, stacked.stackId || '']);
        const previous = stacks.get(key);
        if (previous && !isEqual(previous.options, resolved)) {
            throw new ChartError({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: i18n('error', 'label_inconsistent-stack-labels-options', {
                    firstSeries: previous.name,
                    secondSeries: stacked.name,
                }),
            });
        }
        stacks.set(key, {name: stacked.name, options: resolved});
    }
}
