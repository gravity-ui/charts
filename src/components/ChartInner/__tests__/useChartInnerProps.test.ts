/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {act, renderHook, waitFor} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import type {ChartData} from '../../../types';
import * as gradientReference from '../prepareGradientReference';
import {useChartInnerProps} from '../useChartInnerProps';

test('skipping a hidden gradient avoids reference layout work until it becomes visible', async () => {
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        measureText: (text: string) => ({
            width: text.length * 6,
            fontBoundingBoxAscent: 10,
            fontBoundingBoxDescent: 2,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: text.length * 6,
        }),
    } as CanvasRenderingContext2D);
    const prepareReference = jest.spyOn(gradientReference, 'prepareGradientReference');
    const points = [
        {x: 0, y: 1},
        {x: 1, y: 2},
        {x: 2, y: 3},
    ];
    const data: ChartData = {
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Solid',
                    data: points,
                },
                {
                    type: 'line',
                    name: 'Gradient',
                    legend: {groupId: 'gradient'},
                    color: {
                        type: 'linear-gradient',
                        stops: [
                            {offset: 0, color: '#000000'},
                            {offset: 1, color: '#ffffff'},
                        ],
                    },
                    data: points,
                },
            ],
        },
    };
    const props: Parameters<typeof useChartInnerProps>[0] = {
        data,
        width: 600,
        height: 400,
        clipPathId: 'test',
        dispatcher: dispatch(),
        htmlLayout: null,
        plotNode: null,
        updateRangeSliderState: jest.fn(),
        updateZoomState: jest.fn(),
        zoomState: {x: [1, 2]},
    };

    try {
        const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.gradientReference).toBeDefined());
        expect(result.current.boundsHeight).toBeGreaterThan(0);
        expect(prepareReference).toHaveBeenCalledTimes(1);
        prepareReference.mockClear();

        act(() => {
            result.current.handleLegendItemClick({
                id: 'gradient',
                name: 'Gradient',
                metaKey: true,
            });
        });
        await waitFor(() => expect(result.current.activeLegendItems).not.toContain('gradient'));
        expect(prepareReference).not.toHaveBeenCalled();
        expect(result.current.gradientReference).toBeUndefined();

        const previousWidth = result.current.boundsWidth;
        rerender({...props, width: 800});
        await waitFor(() => expect(result.current.boundsWidth).toBeGreaterThan(previousWidth));
        expect(prepareReference).not.toHaveBeenCalled();

        act(() => {
            result.current.handleLegendItemClick({
                id: 'gradient',
                name: 'Gradient',
                metaKey: true,
            });
        });
        await waitFor(() => expect(result.current.gradientReference).toBeDefined());
        expect(prepareReference).toHaveBeenCalledTimes(1);
    } finally {
        prepareReference.mockRestore();
        getContext.mockRestore();
    }
});
