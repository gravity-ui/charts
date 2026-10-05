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
import type {HoveredValue} from './DefaultTooltipContent/utils';

export interface ChartTooltipContentProps {
    hovered?: TooltipDataChunk[];
    pinned?: boolean;
    renderer?: ChartTooltip['renderer'];
    rows?: ChartTooltip['rows'];
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

interface TooltipContentProps extends ChartTooltipContentProps {
    yAxes?: ChartYAxis[];
    hoveredValues?: HoveredValue[];
}

// Internal entry point receives prepared values explicitly. Public consumers resolve
// their own values from the axes supplied in ChartTooltipContentProps.
export const TooltipContent = React.memo((props: TooltipContentProps) => {
    const {
        hovered,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        xAxis,
        yAxis,
        yAxes,
        hoveredValues,
        renderer,
        rows,
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

    const firstYAxis = yAxis ?? yAxes?.[0];
    const customTooltip = renderer?.({
        headerFormat,
        hovered,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        xAxis,
        yAxis: firstYAxis,
        yAxes,
    }) as React.ReactElement | null | undefined;

    return isNil(customTooltip) ? (
        <DefaultTooltipContent
            hovered={hovered}
            pinned={pinned}
            rows={rows}
            rowRenderer={rowRenderer}
            totals={totals}
            valueFormat={valueFormat}
            headerFormat={headerFormat}
            xAxis={xAxis}
            yAxis={firstYAxis}
            yAxes={yAxes}
            hoveredValues={hoveredValues}
            qa={qa}
        />
    ) : (
        customTooltip
    );
});

TooltipContent.displayName = 'TooltipContent';

export const ChartTooltipContent = React.memo((props: ChartTooltipContentProps) => (
    <TooltipContent
        {...props}
        yAxes={props.yAxis ? [props.yAxis] : undefined}
        hoveredValues={undefined}
    />
));

ChartTooltipContent.displayName = 'ChartTooltipContent';
