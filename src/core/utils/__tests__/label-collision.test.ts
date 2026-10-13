import {getVisibleLabelIndexes, hideOverlappingTickLabels} from '../axis/label-collision';

function getSvgTick(x: number, angle = -45, width = 120, height = 14, y = 0) {
    return {
        svgLabel: {
            x,
            y,
            angle,
            content: [{text: 'Long label', x: 0, y: 0, size: {width, height}}],
        },
        htmlLabel: null,
    };
}

function getVisibility(ticks: Parameters<typeof hideOverlappingTickLabels>[0]) {
    return ticks.map(({svgLabel, htmlLabel}) => Boolean(svgLabel || htmlLabel));
}

describe('hideOverlappingTickLabels', () => {
    describe.each([-45, 45])('rotated rows at %s degrees', (angle) => {
        test.each([
            {
                name: 'keeps separate rows',
                spacing: 30,
                padding: 6,
                visibility: [true, true, true, true, true],
            },
            {
                name: 'removes intersecting rows',
                spacing: 16,
                padding: 0,
                visibility: [true, false, true, false, true],
            },
            {
                name: 'respects padding between separate rows',
                spacing: 24,
                padding: 6,
                visibility: [true, false, true, false, true],
            },
        ])('$name', ({spacing, padding, visibility}) => {
            const positions = [0, 1, 2, 3, 4].map((index) => index * spacing);
            const ticks = positions.map((position) => getSvgTick(position, angle));

            hideOverlappingTickLabels(ticks, positions, padding);

            expect(getVisibility(ticks)).toEqual(visibility);
        });
    });

    test('preserves first and last unrotated labels', () => {
        const positions = [0, 18, 36];
        const ticks = positions.map((position) => getSvgTick(position, 0, 20));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(getVisibility(ticks)).toEqual([true, false, true]);
    });

    test('preserves HTML label collision behavior', () => {
        const positions = [0, 20, 40];
        const ticks = positions.map((x) => ({
            svgLabel: null,
            htmlLabel: {x, y: 0, content: 'Label', size: {width: 40, height: 12}},
        }));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(getVisibility(ticks)).toEqual([true, false, true]);
    });

    test('preserves vertical unrotated label collision behavior', () => {
        const positions = [0, 10, 20];
        const ticks = positions.map((y) => getSvgTick(0, 0, 40, 12, y));

        hideOverlappingTickLabels(ticks, positions, 0);

        expect(getVisibility(ticks)).toEqual([true, false, true]);
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

        expect(getVisibility(ticks)).toEqual([true, visible]);
    });

    test('handles oversized row bounds', () => {
        const positions = [0, 30, 60];
        const ticks = positions.map((position) => getSvgTick(position, -45, 1200, 14));

        hideOverlappingTickLabels(ticks, positions, 6);

        expect(getVisibility(ticks)).toEqual([true, true, true]);
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

        expect(getVisibility(ticks)).toEqual([true, true, true]);
    });
});

describe('getVisibleLabelIndexes', () => {
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
