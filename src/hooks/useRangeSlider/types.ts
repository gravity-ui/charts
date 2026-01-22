import type {ChartXAxis, ChartYAxis} from '../../types';
import type {PreparedRangeSlider, PreparedXAxis, PreparedYAxis} from '../useAxis/types';
import type {ChartScale} from '../useAxisScales/types';
import type {BrushSelection, UseBrushProps} from '../useBrush/types';
import type {PreparedChart} from '../useChartOptions/types';
import type {PreparedLegend, PreparedSeries, PreparedSeriesOptions} from '../useSeries/types';

export type RangeSliderState = {
    max: number;
    min: number;
};

export interface RangeSliderProps {
    boundsOffsetLeft: number;
    boundsWidth: number;
    height: number;
    htmlLayout: HTMLElement | null;
    onUpdate: (nextRangeSliderState?: RangeSliderState, syncZoom?: boolean) => void;
    preparedChart: PreparedChart;
    preparedLegend: PreparedLegend | null;
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
