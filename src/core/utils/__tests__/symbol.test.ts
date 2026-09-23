import {getSymbol, getSymbolBBoxWidth} from '../symbol';

describe.each(['diamond', 'triangle', 'triangle-down'] as const)('%s width', (symbolType) => {
    test.each([0, 64, 400])('matches the rendered vertices for area %s', (symbolSize) => {
        const moveTo = jest.fn();
        const lineTo = jest.fn();
        const context = {moveTo, lineTo, closePath: jest.fn()} as unknown as CanvasPath;
        getSymbol(symbolType).draw(context, symbolSize);
        const xs = [...moveTo.mock.calls, ...lineTo.mock.calls].map(([x]) => x);

        expect(getSymbolBBoxWidth({symbolType, symbolSize})).toBeCloseTo(
            Math.max(...xs) - Math.min(...xs),
        );
    });
});
