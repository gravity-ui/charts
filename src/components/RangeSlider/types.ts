import type {UseBrushProps} from '../../hooks/useBrush/types';
import type {
    // PreparedAxis,
    PreparedChart,
    PreparedRangeSlider,
} from '../../hooks/useChartOptions/types';
import type {
    PreparedLegend,
    PreparedSeries,
    PreparedSeriesOptions,
} from '../../hooks/useSeries/types';
import type {ZoomState} from '../../hooks/useZoom/types';
import type {ChartXAxis, ChartYAxis} from '../../types';

export interface RangeSliderProps {
    boundsOffsetLeft: number;
    boundsWidth: number;
    height: number;
    htmlLayout: HTMLElement | null;
    onUpdate: (zoomState: Partial<ZoomState>) => void;
    preparedChart: PreparedChart;
    preparedLegend: PreparedLegend | null;
    preparedRangeSlider: PreparedRangeSlider;
    preparedSeries: PreparedSeries[];
    preparedSeriesOptions: PreparedSeriesOptions;
    width: number;
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis[];
    zoomStateX?: ZoomState['x'];
}

export interface PreparedRangeSliderProps extends Omit<PreparedRangeSlider, 'enabled'> {
    offsetLeft: number;
    offsetTop: number;
    // preparedXAxis: PreparedAxis | null;
    // preparedYAxis: PreparedAxis[];
    shapes: React.ReactElement[];
    width: number;
    onBrushEnd?: UseBrushProps['onBrushEnd'];
    selection?: [number, number];
}
