import type {PreparedRangeSlider, PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {BrushSelection, UseBrushProps} from '~core/brush/types';
import type {PreparedChart} from '~core/chart/types';
import type {RangeSliderState} from '~core/range-slider/types';
import type {ChartScale} from '~core/scales/types';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '~core/series/types';

import type {ChartXAxis, ChartYAxis, LegendConfig} from '../../types';

export type {RangeSliderState};

export interface RangeSliderProps {
    activeLegendItems: string[];
    boundsOffsetLeft: number;
    boundsWidth: number;
    height: number;
    htmlLayout: HTMLElement | null;
    onUpdate: (nextRangeSliderState?: RangeSliderState) => void;
    preparedChart: PreparedChart;
    preparedLegend: PreparedLegend | null;
    legendConfig: LegendConfig | undefined;
    preparedRangeSlider: PreparedRangeSlider;
    preparedSeries: PreparedSeries[];
    preparedSeriesOptions: PreparedSeriesOptions;
    width: number;
    rangeSliderState?: RangeSliderState;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
}

export interface UseRangeSliderProps extends RangeSliderProps {
    clipPathId: string;
}

export interface PreparedRangeSliderProps extends Omit<PreparedRangeSlider, 'enabled'> {
    htmlLayout: HTMLElement | null;
    offsetLeft: number;
    offsetTop: number;
    preparedXAxis: PreparedXAxis | null;
    preparedYAxis: PreparedYAxis[] | null;
    shapes: React.ReactElement[];
    width: number;
    onBrushEnd?: UseBrushProps['onBrushEnd'];
    onOverlayClick?: (this: SVGGElement, event: React.MouseEvent<SVGRectElement>) => void;
    selection?: BrushSelection;
    xScale?: ChartScale;
}
