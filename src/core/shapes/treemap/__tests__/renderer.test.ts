/** @jest-environment jsdom */

import {color} from 'd3-color';
import {dispatch} from 'd3-dispatch';

import type {TreemapSeriesData} from '../../../../types';
import {getPreparedOptions} from '../../../series/prepare-options';
import type {PreparedTreemapSeries} from '../../../series/types';
import {renderTreemap} from '../renderer';
import type {PreparedTreemapData} from '../types';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const POINT_COLOR = 'rgb(0, 0, 200)';
const LEVEL_COLOR = 'rgb(200, 0, 0)';
const SERIES_COLOR = 'rgb(0, 128, 0)';

function createPlot() {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    const plot = document.createElementNS(SVG_NAMESPACE, 'g');
    svg.append(plot);
    document.body.append(svg);
    return plot;
}

function createLeaf(data: TreemapSeriesData, depth: number, x0: number) {
    return {data, depth, id: data.id, x0, x1: x0 + 10, y0: 0, y1: 10};
}

describe('renderTreemap colors', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    test('keeps point > level > series color precedence on hover and pointer leave', () => {
        const plot = createPlot();
        const labelsPlot = createPlot();
        const pointColored: TreemapSeriesData = {
            id: 'point',
            name: 'A',
            value: 1,
            color: POINT_COLOR,
        };
        const levelColored: TreemapSeriesData = {id: 'level', name: 'B', value: 1};
        const seriesColored: TreemapSeriesData = {id: 'series', name: 'C', value: 1};
        const series = {
            color: SERIES_COLOR,
            cursor: null,
            levels: [{index: 1, color: LEVEL_COLOR}],
        } as unknown as PreparedTreemapSeries;
        const preparedData = {
            labelData: [],
            leaves: [
                createLeaf(pointColored, 1, 0),
                createLeaf(levelColored, 1, 10),
                createLeaf(seriesColored, 2, 20),
            ],
            series,
        } as unknown as PreparedTreemapData;
        const dispatcher = dispatch('hover-shape');
        // eslint-disable-next-line testing-library/render-result-naming-convention -- renderTreemap returns a cleanup function.
        const cleanup = renderTreemap(
            {plot, labelsPlot},
            preparedData,
            getPreparedOptions({treemap: {states: {hover: {enabled: true, brightness: 0.3}}}}),
            dispatcher,
        );
        const getFills = () =>
            ['point', 'level', 'series'].map((id) =>
                plot.querySelector(`rect[id="${id}"]`)?.getAttribute('fill'),
            );
        const initialFills = [POINT_COLOR, LEVEL_COLOR, SERIES_COLOR];
        const brighter = (value: string) => color(value)?.brighter(0.3).toString();

        expect(getFills()).toEqual(initialFills);

        dispatcher.call('hover-shape', undefined, [{data: pointColored}]);
        expect(getFills()).toEqual([brighter(POINT_COLOR), LEVEL_COLOR, SERIES_COLOR]);

        dispatcher.call('hover-shape', undefined, [{data: levelColored}]);
        expect(getFills()).toEqual([POINT_COLOR, brighter(LEVEL_COLOR), SERIES_COLOR]);

        dispatcher.call('hover-shape', undefined, undefined);
        expect(getFills()).toEqual(initialFills);

        cleanup();
    });
});
