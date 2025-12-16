import React from 'react';

import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import type {BaseTextStyle, ChartSplit, SplitPlotOptions} from '../../types';
import {calculateNumericProperty, getHorizontalSvgTextHeight} from '../../utils';

import type {PreparedPlot, PreparedPlotTitle, PreparedSplit} from './types';

type UseSplitArgs = {
    split?: ChartSplit;
    boundsHeight: number;
    chartWidth: number;
};

const DEFAULT_TITLE_FONT_SIZE = '15px';
const TITLE_TOP_BOTTOM_PADDING = 8;

function preparePlotTitle(args: {
    title: SplitPlotOptions['title'];
    plotIndex: number;
    plotHeight: number;
    chartWidth: number;
    gap: number;
}): PreparedPlotTitle {
    const {title, plotIndex, plotHeight, chartWidth, gap} = args;
    const titleText = title?.text || '';
    const titleStyle: BaseTextStyle = {
        fontSize: get(title, 'style.fontSize', DEFAULT_TITLE_FONT_SIZE),
        fontWeight: get(title, 'style.fontWeight'),
    };
    const titleHeight = titleText
        ? getHorizontalSvgTextHeight({text: titleText, style: titleStyle}) +
          TITLE_TOP_BOTTOM_PADDING * 2
        : 0;
    const top = plotIndex * (plotHeight + gap);

    return {
        text: titleText,
        x: chartWidth / 2,
        y: top + titleHeight / 2,
        style: titleStyle,
        height: titleHeight,
    };
}

export function getPlotHeight(args: {
    split: ChartSplit | undefined;
    boundsHeight: number;
    gap: number;
}) {
    const {split, boundsHeight, gap} = args;
    const plots = split?.plots || [];

    if (plots.length > 1) {
        return (boundsHeight - gap * (plots.length - 1)) / plots.length;
    }

    return boundsHeight;
}

export const useSplit = (args: UseSplitArgs): PreparedSplit => {
    const {split, boundsHeight, chartWidth} = args;

    return React.useMemo(() => {
        const splitGap = calculateNumericProperty({value: split?.gap, base: boundsHeight}) ?? 0;
        const plotHeight = getPlotHeight({split: split, boundsHeight, gap: splitGap});
        const plots = split?.plots ?? [];
        if (isEmpty(plots)) {
            plots.push({});
        }

        return {
            plots: plots.map<PreparedPlot>((p, index) => {
                const title = preparePlotTitle({
                    title: p.title,
                    plotIndex: index,
                    gap: splitGap,
                    plotHeight,
                    chartWidth,
                });
                const top = index * (plotHeight + splitGap);

                return {
                    top: top + title.height,
                    height: plotHeight - title.height,
                    title,
                };
            }),
            gap: splitGap,
        };
    }, [split, boundsHeight, chartWidth]);
};
