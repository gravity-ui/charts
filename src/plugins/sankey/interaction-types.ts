import type {ChartInteractionSeries, MeaningfulAny, SankeySeriesData} from '../../types';

/** Data describing a Sankey link. Node hits return ordinary SankeySeriesData. */
export interface ChartSankeyLinkPoint<T = MeaningfulAny> {
    kind: 'link';
    source: SankeySeriesData<T>;
    target: SankeySeriesData<T>;
    value: number;
}

export interface SankeyInteractionItem<T = MeaningfulAny> {
    series: ChartInteractionSeries<'sankey'>;
    point: SankeySeriesData<T> | ChartSankeyLinkPoint<T>;
}
