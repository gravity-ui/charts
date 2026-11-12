import memoize from 'es-toolkit/compat/memoize';

import type {RectLegendSymbolOptions} from '../../types';
import {SymbolType} from '../constants';
import {getSymbolBBoxWidth} from '../utils';
import {getUniqId} from '../utils/misc';

import {DEFAULT_LEGEND_SYMBOL_PADDING, DEFAULT_LEGEND_SYMBOL_SIZE} from './constants';
import type {
    BasePreparedSeries,
    PathLegendSymbol,
    PreparedLegendSymbol,
    StackedSeries,
} from './types';

export const getActiveLegendItems = (series: Pick<BasePreparedSeries, 'legend' | 'visible'>[]) => {
    return [
        ...new Set(
            series.filter((s) => s.legend.enabled && s.visible).map((s) => s.legend.groupId),
        ),
    ];
};

export const getAllLegendItems = (series: Pick<BasePreparedSeries, 'legend'>[]) => {
    return [...new Set(series.filter((s) => s.legend.enabled).map((s) => s.legend.groupId))];
};

export function prepareLegendSymbol(
    series: {legend?: {symbol?: RectLegendSymbolOptions | PathLegendSymbol}},
    symbolType?: `${SymbolType}`,
): PreparedLegendSymbol {
    const symbolOptions = series.legend?.symbol || {};
    const width = symbolOptions?.width || DEFAULT_LEGEND_SYMBOL_SIZE;
    const type = symbolType || SymbolType.Circle;

    return {
        shape: 'symbol',
        symbolType: type,
        width,
        bboxWidth: getSymbolBBoxWidth({symbolSize: Math.pow(width, 2), symbolType: type}),
        padding: symbolOptions?.padding || DEFAULT_LEGEND_SYMBOL_PADDING,
    };
}

const getCommonStackId = memoize(getUniqId);

export function getSeriesStackId(
    series: Pick<StackedSeries, 'stackId' | 'stacking'> & {resolvedStackId?: string},
) {
    let stackId = series.resolvedStackId ?? series.stackId;

    if (!stackId) {
        stackId = series.stacking ? getCommonStackId() : getUniqId();
    }

    return stackId;
}

export const getVisibleSeries = <T extends Pick<BasePreparedSeries, 'legend' | 'visible'>>({
    preparedSeries,
    activeLegendItems,
}: {
    preparedSeries: T[];
    activeLegendItems: string[];
}) => {
    return preparedSeries.map((singleSeries) => {
        if (singleSeries.legend.enabled) {
            return {
                ...singleSeries,
                visible: activeLegendItems.includes(singleSeries.legend.groupId),
            };
        }

        return singleSeries;
    });
};
