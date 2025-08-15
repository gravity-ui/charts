import {linkHorizontal} from 'd3';

import type {HtmlItem, SankeySeriesData} from '../../../types';
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedSankeySeries} from '../../useSeries/types';

import type {PreparedSankeyData, SankeyDataLabel} from './types';
import sankey from './utils';

type SankeyItemLink = {
    source: SankeySeriesData;
    target: SankeySeriesData;
    value: number;
};

export function sankeyLinkHorizontal() {
    return linkHorizontal<any, unknown>()
        .source((d) => [d.source.x1, d.y0])
        .target((d) => [d.target.x0, d.y1]);
}

export function prepareSankeyData(args: {
    series: PreparedSankeySeries;
    width: number;
    height: number;
}): PreparedSankeyData {
    const {series, width, height} = args;
    const htmlElements: HtmlItem[] = [];

    const sankeyGenerator = sankey<SankeySeriesData, SankeyItemLink>()
        .nodeId((d) => d.name)
        .nodeSort((d) => d.index)
        .nodeWidth(15)
        .nodePadding(10)
        .extent([
            [1, 5],
            [width - 1, height - 5],
        ]);

    const {nodes, links} = sankeyGenerator({
        nodes: series.data,
        links: series.data.reduce<SankeyItemLink[]>((acc, item) => {
            item.links.forEach((l) => {
                const target = series.data.find((d) => d.name === l.name);
                if (target) {
                    acc.push({
                        source: item,
                        target,
                        value: l.value,
                    });
                }
            });

            return acc;
        }, []),
    });

    const sankeyNodes = nodes.map((node) => {
        return {
            x0: node.x0 ?? 0,
            x1: node.x1 ?? 0,
            y0: node.y0 ?? 0,
            y1: node.y1 ?? 0,
            color: node.color ?? '',
            data: series.data[node.index ?? 0],
        };
    });

    const pathGenerator = sankeyLinkHorizontal();
    const sankeyLinks = links.map((d) => {
        return {
            opacity: 0.75,
            color: d.source.color ?? '',
            path: pathGenerator(d),
            strokeWidth: Math.max(1, d.width ?? 0),
            source: d.source,
            target: d.target,
            value: d.value,
        };
    });

    const dataLabels: SankeyDataLabel[] = [];
    if (series.dataLabels.enabled) {
        const labels = nodes.map<SankeyDataLabel>((d) => {
            const x0 = d.x0 ?? 0;
            const x1 = d.x1 ?? 0;
            const y0 = d.y0 ?? 0;
            const y1 = d.y1 ?? 0;
            const text = getFormattedValue({value: d.name, ...dataLabels});

            return {
                text,
                x: x0 < width / 2 ? x1 + 6 : x0 - 6,
                y: (y1 + y0) / 2,
                textAnchor: x0 < width / 2 ? 'start' : 'end',
                style: series.dataLabels.style,
            };
        });
        dataLabels.push(...labels);
    }

    return {series, nodes: sankeyNodes, links: sankeyLinks, htmlElements, labels: dataLabels};
}
