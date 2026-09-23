import {getSymbol, getSymbolSize} from '../symbol';

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
