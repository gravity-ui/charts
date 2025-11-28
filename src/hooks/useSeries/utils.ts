import memoize from 'lodash/memoize';

import {SymbolType} from '../../constants';
import type {RectLegendSymbolOptions} from '../../types';
import {getUniqId} from '../../utils/misc';

import {DEFAULT_LEGEND_SYMBOL_PADDING, DEFAULT_LEGEND_SYMBOL_SIZE} from './constants';
import type {PathLegendSymbol, PreparedLegendSymbol, PreparedSeries, StackedSeries} from './types';

export const getActiveLegendItems = (series: PreparedSeries[]) => {
    return series.reduce<string[]>((acc, s) => {
        if (s.legend.enabled && s.visible) {
            acc.push(s.legend.groupId);
        }

        return acc;
    }, []);
};

export const getAllLegendItems = (series: PreparedSeries[]) => {
    return series.map((s) => s.legend.groupId);
};

export function prepareLegendSymbol(
    series: {legend?: {symbol?: RectLegendSymbolOptions | PathLegendSymbol}},
    symbolType?: `${SymbolType}`,
): PreparedLegendSymbol {
    const symbolOptions = series.legend?.symbol || {};

    return {
        shape: 'symbol',
        symbolType: symbolType || SymbolType.Circle,
        width: symbolOptions?.width || DEFAULT_LEGEND_SYMBOL_SIZE,
        padding: symbolOptions?.padding || DEFAULT_LEGEND_SYMBOL_PADDING,
    };
}

const getCommonStackId = memoize(getUniqId);

export function getSeriesStackId(series: StackedSeries) {
    let stackId = series.stackId;

    if (!stackId) {
        stackId = series.stacking ? getCommonStackId() : getUniqId();
    }

    return stackId;
}
