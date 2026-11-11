import type {BasePreparedSeries} from '~core/series/types';

import type {BarYSeries, BarYSeriesData, BarYValueFormat, BaseTextStyle} from '../../types';
import type {PreparedBarLabelPlacement} from '../bar-label-placement';

export type PreparedBarYSeries = {
    opacity: number;
    type: BarYSeries['type'];
    data: BarYSeriesData[];
    stackId: string;
    /** Independent layout/domain key for non-stacked overlays. */
    resolvedStackId?: string;
    stacking: BarYSeries['stacking'];
    grouping: boolean;
    barPadding: number;
    /** Largest resolved padding in the stack, including hidden series. */
    stackBarPadding: number;
    barMaxWidth: number;
    /** Smallest resolved width limit in the stack, including hidden series. */
    stackBarMaxWidth: number;
    stackLabels?: BarYSeries['stackLabels'];
    valueAxis: 'x';
    dataLabels: PreparedBarLabelPlacement & {
        padding: number;
        enabled: boolean;
        inside: boolean;
        style: BaseTextStyle;
        maxHeight: number;
        maxWidth: number;
        html: boolean;
        format?: BarYValueFormat;
        allowOverlap: boolean;
    };
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
} & BasePreparedSeries<BarYSeries['tooltip']>;
