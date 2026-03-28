import React from 'react';

import isNil from 'lodash/isNil';

import type {
    ChartTooltip,
    ChartTooltipRendererArgs,
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
} from '../../types';

import {DefaultTooltipContent} from './DefaultTooltipContent';

export interface ChartTooltipContentProps {
    hovered?: TooltipDataChunk[];
    pinned?: boolean;
    renderer?: ChartTooltip['renderer'];
    rowRenderer?: ChartTooltip['rowRenderer'];
    valueFormat?: ChartTooltip['valueFormat'];
    headerFormat?: ChartTooltip['headerFormat'];
    hoveredPlotBands?: ChartTooltipRendererArgs['hoveredPlotBands'];
    hoveredPlotLines?: ChartTooltipRendererArgs['hoveredPlotLines'];
    hoveredPlotShapes?: ChartTooltipRendererArgs['hoveredPlotShapes'];
    totals?: ChartTooltip['totals'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    qa?: string;
}

export const ChartTooltipContent = React.memo((props: ChartTooltipContentProps) => {
    const {
        hovered,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        xAxis,
        yAxis,
        renderer,
        rowRenderer,
        valueFormat,
        headerFormat,
        totals,
        pinned,
        qa,
    } = props;

    if (!hovered) {
        return null;
    }

    const customTooltip = renderer?.({
        headerFormat,
        hovered,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        xAxis,
        yAxis,
    });

    return isNil(customTooltip) ? (
        <DefaultTooltipContent
            hovered={hovered}
            pinned={pinned}
            rowRenderer={rowRenderer}
            totals={totals}
            valueFormat={valueFormat}
            headerFormat={headerFormat}
            xAxis={xAxis}
            yAxis={yAxis}
            qa={qa}
        />
    ) : (
        customTooltip
    );
});

ChartTooltipContent.displayName = 'ChartTooltipContent';
