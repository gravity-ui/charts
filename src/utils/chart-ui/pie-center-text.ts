import {select} from 'd3-selection';
import get from 'lodash/get';

import {calculateNumericProperty} from '../chart/math';
import {getLabelsSize, handleOverflowingText} from '../chart/text';

const MAX_FONT_SIZE = 64;
const MIN_FONT_SIZE = 8;

export function pieCenterText(
    text: string,
    options?: {padding?: string | number; color?: string; minFontSize?: number},
) {
    if (!text) {
        return undefined;
    }

    const color = get(options, 'color', 'currentColor');

    return function (args: {series: {innerRadius: number}}) {
        let fontSize = MAX_FONT_SIZE;

        const textSize = getLabelsSize({labels: [text], style: {fontSize: `${fontSize}px`}});
        let availableSpace = args.series.innerRadius * 2;
        const padding =
            calculateNumericProperty({
                base: availableSpace,
                value: options?.padding,
            }) ?? 12;

        if (padding < args.series.innerRadius) {
            availableSpace -= padding * 2;
        }

        fontSize = Math.max(
            options?.minFontSize ?? MIN_FONT_SIZE,
            (fontSize * availableSpace) / Math.max(textSize.maxWidth, textSize.maxHeight),
        );

        const tempWrapper = select(document.body).append('svg');
        const container = tempWrapper.append('g');

        const textSelection = container
            .append('text')
            .style('font-size', `${fontSize}px`)
            .style('fill', color);
        textSelection.append('title').text(text);
        const tspan = textSelection
            .append('tspan')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(text);
        handleOverflowingText(tspan.node(), availableSpace);

        const result = container.node();
        tempWrapper.remove();
        return result;
    };
}
