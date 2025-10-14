import React from 'react';

import type {
    ChartTooltipTotalsAggregationValue,
    ChartTooltipTotalsBuiltInAggregation,
    ValueFormat,
} from '../../../types';
import {block} from '../../../utils';
import {getFormattedValue} from '../../../utils/chart/format';

import {Row} from './Row';
import {getBuiltInAggregatedValue, getBuiltInAggregationLabel} from './utils';
import type {HoveredValue} from './utils';

const b = block('tooltip');

// label: React.ReactNode;
//     value: React.ReactNode;
//     active?: boolean;
//     className?: string;
//     color?: string;
//     striped?: boolean;
//     style?: React.CSSProperties;

export function RowWithAggregation(props: {
    aggregation: ChartTooltipTotalsBuiltInAggregation | (() => ChartTooltipTotalsAggregationValue);
    values: HoveredValue[];
    label?: string;
    striped?: boolean;
    style?: React.CSSProperties;
    valueFormat?: ValueFormat;
}) {
    const {aggregation, label, striped, style, valueFormat, values} = props;
    let resultLabel = label;

    if (!resultLabel && typeof aggregation === 'string') {
        resultLabel = getBuiltInAggregationLabel({aggregation});
    }

    const resultValue =
        typeof aggregation === 'function'
            ? aggregation()
            : getBuiltInAggregatedValue({aggregation, values});
    const formattedResultValue =
        typeof resultValue === 'number'
            ? getFormattedValue({
                  value: resultValue,
                  format: valueFormat || {type: 'number'},
              })
            : resultValue;

    return (
        <Row
            className={b('content-row-totals')}
            label={resultLabel}
            striped={striped}
            style={style}
            value={formattedResultValue}
        />
    );
}
