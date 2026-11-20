import type {BaseSeries, BaseSeriesLegend} from '../types';
import {getUniqId} from '../utils/misc';

import type {BasePreparedSeries, PreparedLegendOptions, PreparedLegendSymbol} from './types';
import {prepareLegendSymbol} from './utils';

interface SeriesMetadataInput<TTooltip> extends Pick<BaseSeries, 'visible' | 'cursor' | 'custom'> {
    id?: string;
    name?: string;
    legend?: BaseSeriesLegend;
    tooltip?: TTooltip;
}

interface PrepareSeriesMetadataArgs<TTooltip> {
    series: SeriesMetadataInput<TTooltip>;
    color: string;
    legend: Pick<PreparedLegendOptions, 'enabled'>;
    /** Resolved plugin-specific symbol; defaults to the shared circle symbol. */
    symbol?: PreparedLegendSymbol;
}

/**
 * Creates the metadata required by shared legend, visibility, tooltip and interaction code.
 * IDs are unique across calls, independent of layer-local indices. An explicit ID is retained.
 * Plugins add their own type and prepared data; raw configuration is never modified.
 */
export function prepareSeriesMetadata<
    TTooltip extends BaseSeries['tooltip'] = BaseSeries['tooltip'],
>({
    series,
    color,
    legend,
    symbol,
}: PrepareSeriesMetadataArgs<TTooltip>): BasePreparedSeries<TTooltip | undefined> {
    const name = series.name ?? '';
    return {
        id: series.id ?? getUniqId(),
        name,
        color,
        visible: series.visible ?? true,
        legend: {
            enabled: series.legend?.enabled ?? legend.enabled,
            groupId: series.legend?.groupId ?? getUniqId(),
            itemText: series.legend?.itemText ?? name,
            source: series.legend,
            symbol: symbol ?? prepareLegendSymbol({}),
        },
        cursor: series.cursor ?? null,
        tooltip: series.tooltip,
        custom: series.custom,
    };
}
