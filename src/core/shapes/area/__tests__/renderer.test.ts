/** @jest-environment jsdom */

import type {PreparedAreaSeries, PreparedSeriesOptions} from '../../../series/types';
import type {LinearGradient} from '../../../types';
import {renderArea} from '../renderer';
import type {PointData, PreparedAreaData} from '../types';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const lineGradient: LinearGradient = {
    type: 'linear-gradient',
    angle: 90,
    stops: [
        {offset: 0, color: '#ff0000'},
        {offset: 1, color: '#0000ff'},
    ],
};

const fillGradient: LinearGradient = {
    type: 'linear-gradient',
    angle: 180,
    stops: [
        {offset: 0, color: '#ffffff'},
        {offset: 1, color: '#000000'},
    ],
};

function createPlot() {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    const plot = document.createElementNS(SVG_NAMESPACE, 'g');
    svg.append(plot);
    document.body.append(svg);
    return plot;
}

function createPreparedData(points: Array<Pick<PointData, 'hiddenInLine' | 'x' | 'y' | 'y0'>>) {
    const series = {
        cursor: null,
        fillColor: 'rgb(128, 128, 128)',
        fillGradient,
        gradient: lineGradient,
        id: 'area-1',
        type: 'area',
    } as PreparedAreaSeries;
    return {
        active: true,
        annotations: [],
        color: 'rgb(128, 0, 128)',
        getHoverMarkers: () => [],
        hovered: false,
        htmlLabels: [],
        id: series.id,
        markers: [],
        opacity: 0.75,
        points: points.map((point) => ({
            ...point,
            data: {x: point.x, y: point.y},
            series,
        })),
        series,
        svgLabels: [],
        width: 2,
    } as unknown as PreparedAreaData;
}

describe('renderArea gradient', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    test('uses independent bounds and definitions for line and fill gradients', () => {
        const plot = createPlot();
        const data = createPreparedData([
            {x: 0, y: 20, y0: 100},
            {x: 100, y: 40, y0: 100},
            {x: 1000, y: 1000, y0: 2000, hiddenInLine: true},
        ]);

        renderArea({plot}, [data], {} as PreparedSeriesOptions, true);

        const line = plot.querySelector('.gcharts-area__line');
        const region = plot.querySelector('.gcharts-area__region');
        const gradients = plot.querySelectorAll('linearGradient');
        expect(gradients).toHaveLength(2);
        expect(line?.getAttribute('stroke')).toBe(`url(#${gradients[0].id})`);
        expect(region?.getAttribute('fill')).toBe(`url(#${gradients[1].id})`);
        expect(gradients[0].getAttribute('x1')).toBe('0');
        expect(gradients[0].getAttribute('x2')).toBe('100');
        expect(Number(gradients[1].getAttribute('y1'))).toBeCloseTo(20);
        expect(Number(gradients[1].getAttribute('y2'))).toBeCloseTo(100);
    });

    test('replaces both gradient definitions on rerender', () => {
        const plot = createPlot();
        const data = createPreparedData([
            {x: 0, y: 20, y0: 100},
            {x: 100, y: 40, y0: 100},
        ]);

        renderArea({plot}, [data], {} as PreparedSeriesOptions, true);
        renderArea({plot}, [data], {} as PreparedSeriesOptions, true);

        expect(plot.querySelectorAll('defs.gradients')).toHaveLength(1);
        expect(plot.querySelectorAll('linearGradient')).toHaveLength(2);
    });
});
