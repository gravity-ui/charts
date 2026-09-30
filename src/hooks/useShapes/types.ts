import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedSeries} from '~core/series/types';

export interface GradientReference {
    boundsWidth: number;
    boundsHeight: number;
    series: PreparedSeries[];
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    split: PreparedSplit;
}
