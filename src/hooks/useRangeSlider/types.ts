import type {ChartScale} from '../../core/scales/types';
import type {ChartXAxis, ChartYAxis, LegendConfig} from '../../types';
import type {PreparedChart} from '../types';
import type {PreparedRangeSlider, PreparedXAxis, PreparedYAxis} from '../useAxis/types';
import type {BrushSelection, UseBrushProps} from '../useBrush/types';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '../useSeries/types';

export type RangeSliderState = {
    max: number;
    min: number;
};

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
