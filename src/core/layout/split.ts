import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import type {BaseTextStyle, ChartSplit, SplitPlotOptions} from '../../types';
import {calculateNumericProperty, getTextSizeFn} from '../utils';

import type {PreparedPlot, PreparedPlotTitle} from './split-types';

type UseSplitArgs = {
    split?: ChartSplit;
    boundsHeight: number;
    chartWidth: number;
};

const DEFAULT_TITLE_FONT_SIZE = '15px';
const TITLE_TOP_BOTTOM_PADDING = 8;

async function preparePlotTitle(args: {
    title: SplitPlotOptions['title'];
    plotIndex: number;
    plotHeight: number;
    chartWidth: number;
    gap: number;
}): Promise<PreparedPlotTitle> {
    const {title, plotIndex, plotHeight, chartWidth, gap} = args;
    const titleText = title?.text || '';
    const titleStyle: BaseTextStyle = {
        fontSize: get(title, 'style.fontSize', DEFAULT_TITLE_FONT_SIZE),
        fontWeight: get(title, 'style.fontWeight'),
    };
    const titleHeight = titleText
        ? (await getTextSizeFn({style: titleStyle})(titleText)).height +
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

export async function getSplit(args: UseSplitArgs) {
    const {split, boundsHeight, chartWidth} = args;
    const splitGap = calculateNumericProperty({value: split?.gap, base: boundsHeight}) ?? 0;
    const plotHeight = getPlotHeight({split: split, boundsHeight, gap: splitGap});
    const plots = split?.plots ?? [];
    if (isEmpty(plots)) {
        plots.push({});
    }

    const items: PreparedPlot[] = [];
    for (let index = 0; index < plots.length; index++) {
        const p = plots[index];
        const title = await preparePlotTitle({
            title: p.title,
            plotIndex: index,
            gap: splitGap,
            plotHeight,
            chartWidth,
        });
        const top = index * (plotHeight + splitGap);

        items.push({
            top: top + title.height,
            height: plotHeight - title.height,
            title,
        });
    }

    return {
        plots: items,
        gap: splitGap,
    };
}
