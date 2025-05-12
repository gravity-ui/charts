import React from 'react';

import isNil from 'lodash/isNil';

import type {ChartTooltip, ChartXAxis, ChartYAxis, TooltipDataChunk} from '../../types';

import {DefaultContent} from './DefaultContent';

export interface ChartTooltipContentProps {
    hovered?: TooltipDataChunk[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
    renderer?: ChartTooltip['renderer'];
    valueFormat?: ChartTooltip['valueFormat'];
}

export const ChartTooltipContent = (props: ChartTooltipContentProps) => {
    const {hovered, xAxis, yAxis, renderer, valueFormat} = props;

    if (!hovered) {
        return null;
    }

    const customTooltip = renderer?.({hovered, xAxis, yAxis});

    return isNil(customTooltip) ? (
        <DefaultContent hovered={hovered} xAxis={xAxis} yAxis={yAxis} valueFormat={valueFormat} />
    ) : (
        customTooltip
    );
};
