import type {SeriesPluginData} from '~core/series/plugin';
import type {PreparedSeries, PreparedSeriesOptions} from '~core/series/types';
import type {SeriesShapeData, TooltipItemData} from '~core/shapes/types';
import type {ChartInteractionItem, ChartSeries, ChartSeriesOptions} from '~core/types';

/** Built-in chart context; custom plugins can implement SeriesPluginData directly. */
export interface BuiltinPluginData<
    TPrepared extends PreparedSeries,
    TShape extends SeriesShapeData & TooltipItemData,
    TInteraction extends ChartInteractionItem = ChartInteractionItem,
    TTooltipItem extends TooltipItemData = TShape,
> extends SeriesPluginData<TPrepared['type']> {
    prepared: TPrepared;
    shape: TShape;
    tooltipItem: TTooltipItem;
    interaction: TInteraction;
    options: ChartSeriesOptions;
    preparedOptions: PreparedSeriesOptions;
    allRaw: ChartSeries;
    allPrepared: PreparedSeries;
}
