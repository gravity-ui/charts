import type {BasePreparedAxisRelatedSeries, BasePreparedSeries} from '~core/series/types';

import type {BarXSeries, BarXSeriesData, BarXValueFormat, BaseTextStyle} from '../../types';
import type {PreparedBarLabelPlacement} from '../bar-label-placement';

export type PreparedBarXSeries = {
    opacity: number;
    type: BarXSeries['type'];
    data: BarXSeriesData[];
    stackId: string;
    /** Independent layout/domain key for non-stacked overlays. */
    resolvedStackId?: string;
    stacking: BarXSeries['stacking'];
    grouping: boolean;
    barPadding: number;
    /** Largest resolved padding in the stack, including hidden series. */
    stackBarPadding: number;
    barMaxWidth: number;
    /** Smallest resolved width limit in the stack, including hidden series. */
    stackBarMaxWidth: number;
    stackLabels?: BarXSeries['stackLabels'];
    valueAxis: 'y';
    dataLabels: PreparedBarLabelPlacement & {
        enabled: boolean;
        inside: boolean;
        style: BaseTextStyle;
        allowOverlap: boolean;
        padding: number;
        html: boolean;
        format?: BarXValueFormat;
    };
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    yAxis: number;
} & BasePreparedSeries<BarXSeries['tooltip']> &
    BasePreparedAxisRelatedSeries;
