import {prepareTooltipShapes} from '../../../../__tests__/utils/prepare-tooltip-shapes';
import type {ChartSeries} from '../../../../types';
import {getClosestPoints} from '../../../utils/get-closest-data';
import * as textUtils from '../../../utils/text';

test('unequal grouped stacks keep bar and line rows in the same tooltip category', async () => {
    const textSize = jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(async () => ({
        width: 10,
        height: 10,
        hangingOffset: 0,
        inkBounds: {x: 0, width: 10},
    }));
    const wrappedText = jest.spyOn(textUtils, 'wrapText').mockResolvedValue([]);
    try {
        const series: ChartSeries[] = [
            ...[0, 1, 2].map((index) => ({
                type: 'bar-x' as const,
                name: `Bar ${index}`,
                stacking: 'normal' as const,
                stackId: index < 2 ? 'left' : 'right',
                data: [{x: 'A', y: 50}],
            })),
            {
                type: 'line',
                name: 'Line',
                data: [
                    {x: 'A', y: 140},
                    {x: 'B', y: 140},
                ],
            },
        ];
        const {shapesData, layerIndexes} = await prepareTooltipShapes(series, ['A', 'B']);
        const chunks = getClosestPoints({
            shapesData,
            layerIndexes,
            position: [75, 140],
            boundsWidth: 300,
            boundsHeight: 300,
        });
        expect(new Set(chunks.map((chunk) => chunk.series.name))).toEqual(
            new Set(['Bar 0', 'Bar 1', 'Bar 2', 'Line']),
        );
        expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
            'Line',
        ]);
    } finally {
        textSize.mockRestore();
        wrappedText.mockRestore();
    }
});
