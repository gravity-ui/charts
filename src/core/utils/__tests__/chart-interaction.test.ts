/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {getTargetElements as heatmapTargets} from '../../../plugins/heatmap/interaction';
import {sankeyPlugin} from '../../../plugins/sankey';
import {getTargetElements as sankeyTargets} from '../../../plugins/sankey/interaction';
import {getTargetElements as treemapTargets} from '../../../plugins/treemap/interaction';
import type {SankeySeries, TooltipDataChunkSankey} from '../../../types';
import {getChartTargets, registerInteractionLayer} from '../chart-interaction';

const svgNamespace = 'http://www.w3.org/2000/svg';

test('interaction registrations are isolated by SVG root and removed on cleanup', () => {
    const first = document.createElementNS(svgNamespace, 'svg');
    const second = document.createElementNS(svgNamespace, 'svg');
    const plot = document.createElementNS(svgNamespace, 'g');
    const sibling = document.createElementNS(svgNamespace, 'g');
    first.append(plot, sibling);
    const elements = jest.fn(() => []);
    const siblingElements = jest.fn(() => []);
    const unregister = registerInteractionLayer(plot, elements);
    const unregisterSibling = registerInteractionLayer(sibling, siblingElements);
    getChartTargets(second, [10, 10]);
    expect(elements).not.toHaveBeenCalled();
    getChartTargets(first, [10, 10]);
    expect(elements).toHaveBeenCalledTimes(1);
    expect(siblingElements).toHaveBeenCalledTimes(1);
    unregister();
    getChartTargets(first, [10, 10]);
    expect(elements).toHaveBeenCalledTimes(1);
    expect(siblingElements).toHaveBeenCalledTimes(2);
    unregisterSibling();
    getChartTargets(first, [10, 10]);
    expect(siblingElements).toHaveBeenCalledTimes(2);
});

test.each([heatmapTargets, treemapTargets, sankeyTargets])(
    'empty shape groups have no exact targets',
    (getTargets) => {
        const plot = document.createElementNS(svgNamespace, 'g');
        expect(getTargets({plot, markers: plot, preparedData: []})).toEqual([]);
    },
);

test('Sankey interaction adapters distinguish nodes from links and retain zero link values', () => {
    const source = {name: 'Source', links: [{name: 'Target', value: 5}]};
    const target = {name: 'Target', links: []};
    const series: SankeySeries = {type: 'sankey', name: 'Flow', data: [source, target]};
    const getItem = sankeyPlugin.interaction?.getClosestItem;
    if (!getItem) throw new Error('Missing Sankey interaction adapter');
    const node: TooltipDataChunkSankey = {data: source, series};
    expect(getItem(node).point).toBe(source);
    expect(getItem({...node, target}).point).toEqual({kind: 'link', source, target, value: 5});
    expect(getItem({...node, target, value: 0}).point).toEqual({
        kind: 'link',
        source,
        target,
        value: 0,
    });
});
