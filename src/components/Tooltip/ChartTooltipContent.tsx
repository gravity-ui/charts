import React from 'react';

import isNil from 'lodash/isNil';

import type {ChartTooltip, ChartXAxis, ChartYAxis, TooltipDataChunk} from '../../types';

import {DefaultContent} from './DefaultContent';

export type ChartTooltipContentProps = {
    hovered?: TooltipDataChunk[];
    xAxis?: ChartXAxis;
    yAxis?: ChartYAxis;
    renderer?: ChartTooltip['renderer'];
};

export const ChartTooltipContent = (props: ChartTooltipContentProps) => {
    const {hovered, xAxis, yAxis, renderer} = props;

    if (!hovered) {
        return null;
    }

    const customTooltip = renderer?.({hovered, xAxis, yAxis});

    return isNil(customTooltip) ? (
        <DefaultContent hovered={hovered} xAxis={xAxis} yAxis={yAxis} />
    ) : (
        customTooltip
    );
};
