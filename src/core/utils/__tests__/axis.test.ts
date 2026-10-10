import {scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3-scale';

import type {PreparedAxis} from '../../axes/types';
import {getExplicitAxisTickValues} from '../axis/common';
import {getVisibleLabelIndexes, hideOverlappingTickLabels} from '../axis/label-collision';

function getAxis(type: PreparedAxis['type'], values?: (number | string)[]): PreparedAxis {
    return {type, ticks: {values}} as PreparedAxis;
}

describe('getExplicitAxisTickValues', () => {
    test('deduplicates, sorts and clips linear values in domain space', () => {
        const scale = scaleLinear().domain([0, 100]).range([100, 0]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('linear', [50, 10, 50, -10, 110]),
            scale,
        });

        expect(result).toEqual([
            {position: scale(10), value: 10},
            {position: scale(50), value: 50},
        ]);
    });

    test('supports datetime values', () => {
        const scale = scaleUtc()
            .domain([new Date(0), new Date(1000)])
            .range([0, 100]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('datetime', [1000, -1, 500, 500]),
            scale,
        });

        expect(result).toEqual([
            {position: scale(500), value: 500},
            {position: scale(1000), value: 1000},
        ]);
    });

    test('drops invalid logarithmic values', () => {
        const scale = scaleLog().domain([1, 100]).range([0, 100]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('logarithmic', [-1, 0, 1, 10, 100, 1000]),
            scale,
        });

        expect(result).toEqual([
            {position: scale(1), value: 1},
            {position: scale(10), value: 10},
            {position: scale(100), value: 100},
        ]);
    });

    test('orders category values by the scale domain', () => {
        const scale = scaleBand().domain(['C', 'B']).range([0, 100]);
        const result = getExplicitAxisTickValues({
            axis: getAxis('category', ['A', 'B', 'C', 'B']),
            scale,
        });

        expect(result).toEqual([
            {position: (scale('C') ?? 0) + scale.bandwidth() / 2, value: 'C'},
            {position: (scale('B') ?? 0) + scale.bandwidth() / 2, value: 'B'},
        ]);
    });

    test('supports an empty values array and a zero-sized range', () => {
        expect(
            getExplicitAxisTickValues({
                axis: getAxis('linear', []),
                scale: scaleLinear().domain([0, 100]).range([0, 100]),
            }),
        ).toEqual([]);
        expect(
            getExplicitAxisTickValues({
                axis: getAxis('linear', [0, 50, 100]),
                scale: scaleLinear().domain([0, 100]).range([0, 0]),
            }),
        ).toEqual([]);
    });
});

function getSvgTick(x: number, angle = -45, width = 120, height = 14) {
    return {
        svgLabel: {
            x,
            y: 0,
            angle,
            content: [{text: 'Long label', x: 0, y: 0, size: {width, height}}],
        },
        htmlLabel: null,
    };
}

describe('hideOverlappingTickLabels', () => {
    test.each([-45, 45])('keeps separate rotated rows at %s degrees', (angle) => {
        const positions = [0, 30, 60, 90, 120];
        const ticks = positions.map((position) => getSvgTick(position, angle));

        hideOverlappingTickLabels(ticks, positions, 6);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([
            true,
            true,
            true,
            true,
            true,
        ]);
    });

    test('still removes rotated rows that really intersect', () => {
        const positions = [0, 16, 32, 48, 64];
        const ticks = positions.map((position) => getSvgTick(position));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([
            true,
            false,
            true,
            false,
            true,
        ]);
    });

    test('respects padding between otherwise separate rotated rows', () => {
        const positions = [0, 24, 48, 72, 96];
        const ticks = positions.map((position) => getSvgTick(position));

        hideOverlappingTickLabels(ticks, positions, 6);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([
            true,
            false,
            true,
            false,
            true,
        ]);
    });

    test('preserves first and last unrotated labels', () => {
        const positions = [0, 18, 36];
        const ticks = positions.map((position) => getSvgTick(position, 0, 20));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([true, false, true]);
    });

    test('preserves HTML label collision behavior', () => {
        const positions = [0, 20, 40];
        const ticks = positions.map((x) => ({
            svgLabel: null,
            htmlLabel: {x, y: 0, content: 'Label', size: {width: 40, height: 12}},
        }));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(ticks.map(({htmlLabel}) => Boolean(htmlLabel))).toEqual([true, false, true]);
    });

    test('preserves vertical unrotated label collision behavior', () => {
        const positions = [0, 10, 20];
        const ticks = positions.map((y) => ({
            ...getSvgTick(0, 0, 40, 12),
            svgLabel: {...getSvgTick(0, 0, 40, 12).svgLabel, y},
        }));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([true, false, true]);
    });

    test('does not treat the empty part of a rotated AABB as an HTML label collision', () => {
        const ticks = [
            getSvgTick(0),
            {
                svgLabel: null,
                htmlLabel: {x: 0, y: -80, content: 'Label', size: {width: 10, height: 10}},
            },
        ];

        hideOverlappingTickLabels(ticks, [0, 1], 0);

        expect(ticks.map((tick) => Boolean(tick.svgLabel || tick.htmlLabel))).toEqual([true, true]);
    });

    test.each([
        [20, true],
        [8, false],
    ])('checks painted rows of multiline labels at offset %s', (offset, visible) => {
        const first = getSvgTick(0, 45, 40, 10);
        first.svgLabel.content.push({
            text: 'Second row',
            x: 0,
            y: 40,
            size: {width: 40, height: 10},
        });
        const second = getSvgTick(0, 45, 40, 10);
        second.svgLabel.content[0].y = offset;
        const ticks = [first, second];

        hideOverlappingTickLabels(ticks, [0, 1], 0);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([true, visible]);
    });

    test.each([
        [1200, 14],
        [-120, 14],
        [120, -14],
        [-120, -14],
    ])('handles oversized and signed row bounds %s by %s', (width, height) => {
        const positions = [0, 30, 60];
        const ticks = positions.map((position) => getSvgTick(position, -45, width, height));

        hideOverlappingTickLabels(ticks, positions, 6);

        expect(ticks.map(({svgLabel}) => Boolean(svgLabel))).toEqual([true, true, true]);
    });

    test('ignores blank rows and handles a separated zero-sized row', () => {
        const first = getSvgTick(0);
        first.svgLabel.content.push({
            text: ' ',
            x: -1000,
            y: -1000,
            size: {width: 4000, height: 4000},
        });
        const ticks = [first, getSvgTick(30), getSvgTick(1000, -45, 0, 0)];

        hideOverlappingTickLabels(ticks, [0, 30, 1000], 6);

        expect(ticks.slice(0, 2).map(({svgLabel}) => Boolean(svgLabel))).toEqual([true, true]);
    });

    test('keeps plain-bounds callers and axis-position priorities unchanged', () => {
        const visible = getVisibleLabelIndexes(
            [
                {index: 5, position: 20, bounds: {left: 20, right: 40, top: 0, bottom: 12}},
                {index: 3, position: 0, bounds: {left: 0, right: 20, top: 0, bottom: 12}},
                {index: 7, position: 40, bounds: {left: 40, right: 60, top: 0, bottom: 12}},
            ],
            1,
        );

        expect([...visible]).toEqual([3, 7]);
    });
});
