import {create} from 'd3-selection';
import get from 'lodash/get';

import {getLabelsSize} from '../chart/text';

const MAX_FONT_SIZE = 64;

export function pieCenterText(text: string, options?: {padding?: number}) {
    if (!text) {
        return undefined;
    }

    const padding = get(options, 'padding', 12);

    return function (args: {series: {innerRadius: number}}) {
        let fontSize = MAX_FONT_SIZE;

        const textSize = getLabelsSize({labels: [text], style: {fontSize: `${fontSize}px`}});
        fontSize = (fontSize * (args.series.innerRadius - padding) * 2) / textSize.maxWidth;

        const container = create('svg:g');
        container
            .append('text')
            .text(text)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .style('font-size', `${fontSize}px`);

        return container.node();
    };
}
