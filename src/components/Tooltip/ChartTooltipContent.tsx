import React from 'react';

import isNil from 'lodash/isNil';

import type {ChartTooltip, ChartXAxis, ChartYAxis, TooltipDataChunk} from '../../types';

import {DefaultTooltipContent} from './DefaultTooltipContent';

export interface ChartTooltipContentProps {
    hovered?: TooltipDataChunk[];
    xAxis?: ChartXAxis | null;
    yAxis?: ChartYAxis;
    renderer?: ChartTooltip['renderer'];
    rowRenderer?: ChartTooltip['rowRenderer'];
    valueFormat?: ChartTooltip['valueFormat'];
    totals?: ChartTooltip['totals'];
}

export const ChartTooltipContent = (props: ChartTooltipContentProps) => {
    const {hovered, xAxis, yAxis, renderer, rowRenderer, valueFormat, totals} = props;

    if (!hovered) {
        return null;
    }

    const customTooltip = renderer?.({hovered, xAxis, yAxis});

    return isNil(customTooltip) ? (
        <DefaultTooltipContent
            hovered={hovered}
            xAxis={xAxis}
            yAxis={yAxis}
            valueFormat={valueFormat}
            totals={totals}
            rowRenderer={rowRenderer}
        />
    ) : (
        customTooltip
    );
};
