import React from 'react';

import isNil from 'lodash/isNil';

import type {ChartTooltip, ChartXAxis, ChartYAxis, TooltipDataChunk} from '../../types';

import {DefaultTooltipContent} from './DefaultTooltipContent';

export interface ChartTooltipContentProps {
    hovered?: TooltipDataChunk[];
    pinned?: boolean;
    renderer?: ChartTooltip['renderer'];
    rowRenderer?: ChartTooltip['rowRenderer'];
    valueFormat?: ChartTooltip['valueFormat'];
    headerFormat?: ChartTooltip['headerFormat'];
    totals?: ChartTooltip['totals'];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    qa?: string;
}

export const ChartTooltipContent = (props: ChartTooltipContentProps) => {
    const {
        hovered,
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

    const customTooltip = renderer?.({hovered, xAxis, yAxis});

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
};
