import get from 'lodash/get';

import {getDefaultValueFormat} from '../../components/Tooltip/DefaultTooltipContent/utils';
import type {ChartData, ChartSeries, ChartXAxis, ChartYAxis} from '../../types';
import {getDomainDataXBySeries, getDomainDataYBySeries, getMinSpaceBetween} from '../../utils';

import type {PreparedTooltip} from './types';

function getDefaultHeaderFormat({
    seriesData,
    yAxes,
    xAxis,
}: {
    seriesData: ChartSeries[];
    yAxes?: ChartYAxis[];
    xAxis?: ChartXAxis;
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
        return getDefaultValueFormat({axis: yAxes?.[0], closestPointsRange});
    }

    const domainData = getDomainDataXBySeries(seriesData) as number[];
    const closestPointsRange = getMinSpaceBetween(domainData, (d) => d);
    return getDefaultValueFormat({axis: xAxis, closestPointsRange});
}

export const getPreparedTooltip = (args: {
    tooltip: ChartData['tooltip'];
    seriesData: ChartSeries[];
    yAxes?: ChartYAxis[];
    xAxis?: ChartXAxis;
}): PreparedTooltip => {
    const {tooltip, seriesData, yAxes, xAxis} = args;

    return {
        ...tooltip,
        enabled: get(tooltip, 'enabled', true),
        throttle: tooltip?.throttle ?? 0,
        headerFormat: tooltip?.headerFormat ?? getDefaultHeaderFormat({seriesData, yAxes, xAxis}),
    };
};
