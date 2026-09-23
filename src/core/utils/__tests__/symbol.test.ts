import {SymbolType} from '../../constants';
import {getSymbol, getSymbolBBoxWidth, getSymbolSize} from '../symbol';

describe.each(['diamond', 'triangle', 'triangle-down'] as const)('%s height', (symbolType) => {
    test.each([0, 400, 6400])('match the rendered vertices for area %s', (symbolSize) => {
        const moveTo = jest.fn();
        const lineTo = jest.fn();
        const context = {moveTo, lineTo, closePath: jest.fn()} as unknown as CanvasPath;
        getSymbol(symbolType).draw(context, symbolSize);
        const vertices = [...moveTo.mock.calls, ...lineTo.mock.calls];
        const ys = vertices.map(([, y]) => Math.abs(y));
        const dimensions = getSymbolSize({symbolType, symbolSize});

        expect(dimensions.height).toBeCloseTo(2 * Math.max(...ys));
    });
});

describe.each(Object.values(SymbolType))('%s width', (symbolType) => {
    test.each([0, 0.25, 64, 400])('matches the rendered bounds for area %s', (symbolSize) => {
        const moveTo = jest.fn();
        const lineTo = jest.fn();
        const arc = jest.fn();
        const rect = jest.fn();
        const context = {moveTo, lineTo, arc, rect, closePath: jest.fn()} as unknown as CanvasPath;
        getSymbol(symbolType).draw(context, symbolSize);
        const xs = [
            ...[...moveTo.mock.calls, ...lineTo.mock.calls].map(([x]) => x),
            // Circle symbols draw a full arc, so both horizontal extrema are included.
            ...arc.mock.calls.flatMap(([x, , radius]) => [x - radius, x + radius]),
            ...rect.mock.calls.flatMap(([x, , width]) => [x, x + width]),
        ];

        expect(getSymbolBBoxWidth({symbolType, symbolSize})).toBeCloseTo(
            Math.max(...xs) - Math.min(...xs),
        );
    });
});
