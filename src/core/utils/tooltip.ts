import type {ChartSeries, ChartTooltip, ChartXAxis, ChartYAxis} from '../../types';
import {prepareTooltipHeaderFormat} from '../tooltip/header';

export function getDefaultTooltipHeaderFormat(args: {
    seriesData: ChartSeries[];
    yAxes?: ChartYAxis[];
    xAxis?: ChartXAxis;
    dateTimeLabelFormats?: ChartTooltip['dateTimeLabelFormats'];
}) {
    return prepareTooltipHeaderFormat(args)();
}
