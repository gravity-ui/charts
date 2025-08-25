import {create} from 'd3-selection';
import get from 'lodash/get';

import {getLabelsSize} from '../chart/text';

const MAX_FONT_SIZE = 64;

export function pieCenterText(text: string, options?: {padding?: number; color?: string}) {
    if (!text) {
        return undefined;
    }

    const padding = get(options, 'padding', 12);
    const color = get(options, 'color', 'currentColor');

    return function (args: {series: {innerRadius: number}}) {
        let fontSize = MAX_FONT_SIZE;

        const textSize = getLabelsSize({labels: [text], style: {fontSize: `${fontSize}px`}});
        let availableSpace = args.series.innerRadius * 2;
        if (padding < args.series.innerRadius) {
            availableSpace -= padding * 2;
        }
        fontSize = (fontSize * availableSpace) / Math.max(textSize.maxWidth, textSize.maxHeight);

        const container = create('svg:g');
        container
            .append('text')
            .text(text)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .style('font-size', `${fontSize}px`)
            .style('fill', color);

        return container.node();
    };
}
