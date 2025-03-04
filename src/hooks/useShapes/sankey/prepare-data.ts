import {sankey} from 'd3-sankey';

import type {HtmlItem, SankeySeriesData} from '../../../types';
import type {PreparedSankeySeries} from '../../useSeries/types';

import type {PreparedSankeyData, SankeyDataLabel} from './types';

type SankeyItemLink = {
    source: string;
    target: string;
    value: number;
};

export function prepareSankeyData(args: {
    series: PreparedSankeySeries;
    width: number;
    height: number;
}): PreparedSankeyData {
    const {series, width, height} = args;
    const htmlElements: HtmlItem[] = [];

    const sankeyGenerator = sankey<SankeySeriesData, SankeyItemLink>()
        .nodeId((d) => d.name)
        .nodeWidth(15)
        .nodePadding(10)
        .extent([
            [1, 5],
            [width - 1, height - 5],
        ]);

    const {nodes, links} = sankeyGenerator({
        nodes: series.data,
        links: series.data.reduce<SankeyItemLink[]>((acc, item) => {
            const links = item.links.map((l) => ({
                source: item.name,
                target: l.name,
                value: l.value,
            }));
            acc.push(...links);
            return acc;
        }, []),
    });

    const dataLabels: SankeyDataLabel[] = [];
    if (series.dataLabels?.enabled) {
        const labels = nodes.map<SankeyDataLabel>((d) => {
            const x0 = d.x0 ?? 0;
            const x1 = d.x1 ?? 0;
            const y0 = d.y0 ?? 0;
            const y1 = d.y1 ?? 0;

            return {
                text: d.name,
                x: x0 < width / 2 ? x1 + 6 : x0 - 6,
                y: (y1 + y0) / 2,
                textAnchor: x0 < width / 2 ? 'start' : 'end',
            };
        });
        dataLabels.push(...labels);
    }

    return {series, nodes, links, htmlElements, labels: dataLabels};
}
