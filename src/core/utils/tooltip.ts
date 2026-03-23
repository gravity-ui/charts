import {getDefaultValueFormat} from '../../components/Tooltip/DefaultTooltipContent/utils';
import type {ChartSeries, ChartTooltip, ChartXAxis, ChartYAxis} from '../../types';

import {getMinSpaceBetween} from './array';
import {getDomainDataXBySeries, getDomainDataYBySeries} from './common';

export function getDefaultTooltipHeaderFormat({
    seriesData,
    yAxes,
    xAxis,
    dateTimeLabelFormats,
}: {
    seriesData: ChartSeries[];
    yAxes?: ChartYAxis[];
    xAxis?: ChartXAxis;
    dateTimeLabelFormats?: ChartTooltip['dateTimeLabelFormats'];
}) {
    if (
        seriesData.every((item) =>
            ['pie', 'treemap', 'waterfall', 'sankey', 'radar', 'heatmap', 'funnel'].includes(
                item.type,
            ),
        )
    ) {
        return undefined;
    }

    if (seriesData.some((item) => item.type === 'bar-y')) {
        const domainData = getDomainDataYBySeries(seriesData) as number[];
        const closestPointsRange = getMinSpaceBetween(domainData, (d) => d);
        return getDefaultValueFormat({
            axis: yAxes?.[0],
            closestPointsRange,
            dateTimeLabelFormats,
        });
    }

    const domainData = getDomainDataXBySeries(seriesData) as number[];
    const closestPointsRange = getMinSpaceBetween(domainData, (d) => d);
    return getDefaultValueFormat({axis: xAxis, closestPointsRange, dateTimeLabelFormats});
}
