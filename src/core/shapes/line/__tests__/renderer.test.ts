/** @jest-environment jsdom */

import {dispatch} from 'd3-dispatch';
import {curveLinear} from 'd3-shape';

import {getPreparedOptions} from '../../../series/prepare-options';
import type {PreparedLineSeries, PreparedSeriesOptions} from '../../../series/types';
import type {LinearGradient} from '../../../types';
import {renderLine} from '../renderer';
import type {PointData, PreparedLineData} from '../types';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const gradient: LinearGradient = {
    type: 'linear-gradient',
    angle: 90,
    stops: [
        {offset: 0, color: '#ff0000'},
        {offset: 1, color: '#0000ff'},
    ],
};

function createPlot() {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    const plot = document.createElementNS(SVG_NAMESPACE, 'g');
    svg.append(plot);
    document.body.append(svg);
    return plot;
}

function createPreparedData(points: Array<Pick<PointData, 'hiddenInLine' | 'x' | 'y'>>) {
    const series = {cursor: null, gradient, id: 'line-1', type: 'line'} as PreparedLineSeries;
    return {
        active: true,
        annotations: [],
        color: 'rgb(128, 0, 128)',
        dashStyle: 'Solid',
        getHoverMarkers: () => [],
        hovered: false,
        htmlLabels: [],
        id: series.id,
        lineWidth: 2,
        linecap: 'round',
        linejoin: 'round',
        markers: [],
        opacity: 1,
        points: points.map((point) => ({
            ...point,
            data: {x: point.x, y: point.y},
            series,
        })),
        series,
        svgLabels: [],
    } as unknown as PreparedLineData;
}

describe('renderLine gradient', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    test('creates a user-space gradient for the visible path bounds', () => {
        const plot = createPlot();
        const labelsPlot = createPlot();
        const data = createPreparedData([
            {x: 0, y: 50},
            {x: 100, y: 0},
            {x: 1000, y: 1000, hiddenInLine: true},
        ]);

        renderLine(
            {plot, labelsPlot, getCurveFactory: () => curveLinear},
            [data],
            {} as PreparedSeriesOptions,
        );

        const path = plot.querySelector('path');
        const gradientElement = plot.querySelector('linearGradient');
        expect(path?.getAttribute('stroke')).toBe('url(#line-1-gradient-line-normal)');
        expect(gradientElement?.getAttribute('x1')).toBe('0');
        expect(gradientElement?.getAttribute('x2')).toBe('100');
        expect(gradientElement?.querySelectorAll('stop')).toHaveLength(2);
    });

    test('replaces stale gradient definitions on rerender', () => {
        const plot = createPlot();
        const labelsPlot = createPlot();
        const data = createPreparedData([
            {x: 0, y: 50},
            {x: 100, y: 0},
        ]);

        renderLine(
            {plot, labelsPlot, getCurveFactory: () => curveLinear},
            [data],
            {} as PreparedSeriesOptions,
        );
        const firstStroke = plot.querySelector('path')?.getAttribute('stroke');
        renderLine(
            {plot, labelsPlot, getCurveFactory: () => curveLinear},
            [data],
            {} as PreparedSeriesOptions,
        );
        const secondStroke = plot.querySelector('path')?.getAttribute('stroke');

        expect(plot.querySelectorAll('defs.gradients')).toHaveLength(1);
        expect(plot.querySelectorAll('linearGradient')).toHaveLength(1);
        expect(secondStroke).toBe(firstStroke);
        expect(secondStroke).toBe(`url(#${plot.querySelector('linearGradient')?.id})`);
    });

    test('avoids gradient id collisions between plots with the same series id', () => {
        const firstPlot = createPlot();
        const secondPlot = createPlot();
        const points = [
            {x: 0, y: 50},
            {x: 100, y: 0},
        ];

        renderLine(
            {plot: firstPlot, labelsPlot: createPlot(), getCurveFactory: () => curveLinear},
            [createPreparedData(points)],
            {} as PreparedSeriesOptions,
        );
        renderLine(
            {plot: secondPlot, labelsPlot: createPlot(), getCurveFactory: () => curveLinear},
            [createPreparedData(points)],
            {} as PreparedSeriesOptions,
        );

        const firstGradientId = firstPlot.querySelector('linearGradient')?.id;
        const secondGradientId = secondPlot.querySelector('linearGradient')?.id;
        expect(secondGradientId).not.toBe(firstGradientId);
        expect(firstPlot.querySelector('path')?.getAttribute('stroke')).toBe(
            `url(#${firstGradientId})`,
        );
        expect(secondPlot.querySelector('path')?.getAttribute('stroke')).toBe(
            `url(#${secondGradientId})`,
        );
    });
});

describe('renderLine labels', () => {
    afterEach(() => document.body.replaceChildren());

    test('preserves inactive styling and cleans up the hover listener', () => {
        const plot = createPlot();
        const labelsPlot = createPlot();
        const data = createPreparedData([]);
        data.svgLabels = [
            {
                active: true,
                series: data.series,
                text: '50',
                x: 10,
                y: 10,
                size: {width: 20, height: 12},
                style: {fontSize: '12px'},
                textAnchor: 'start',
            },
        ];
        const dispatcher = dispatch('hover-shape');
        // eslint-disable-next-line testing-library/render-result-naming-convention -- D3 returns a cleanup function.
        const cleanup = renderLine(
            {plot, labelsPlot, getCurveFactory: () => curveLinear},
            [data],
            getPreparedOptions({
                line: {states: {inactive: {enabled: true, opacity: 0.2}}},
            }),
            dispatcher,
        );
        const label = labelsPlot.querySelector('text');
        const otherSeries = [{series: {type: 'line', id: 'other'}}];
        dispatcher.call('hover-shape', undefined, otherSeries);
        expect(label?.getAttribute('opacity')).toBe('0.2');
        dispatcher.call('hover-shape', undefined, [{series: data.series}]);
        expect(label?.getAttribute('opacity')).toBeNull();
        dispatcher.call('hover-shape', undefined, otherSeries);
        dispatcher.call('hover-shape', undefined, []);
        expect(label?.getAttribute('opacity')).toBeNull();
        cleanup();
        dispatcher.call('hover-shape', undefined, otherSeries);
        expect(label?.getAttribute('opacity')).toBeNull();
    });
});
