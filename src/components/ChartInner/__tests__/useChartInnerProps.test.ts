/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {act, renderHook, waitFor} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import type {ChartData} from '../../../types';
import * as gradientReference from '../prepareGradientReference';
import {useChartInnerProps} from '../useChartInnerProps';

test.each(['bar-x', 'pie'] as const)(
    'preserves %s legend selection when config/data changes regenerate group IDs',
    async (type) => {
        const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            measureText: (text: string) => ({
                width: text.length * 6,
                fontBoundingBoxAscent: 10,
                fontBoundingBoxDescent: 2,
                actualBoundingBoxLeft: 0,
                actualBoundingBoxRight: text.length * 6,
            }),
        } as CanvasRenderingContext2D);
        function makeData(names: string[], value: number): ChartData {
            return {
                legend: {enabled: true},
                series: {
                    data:
                        type === 'pie'
                            ? [{type, data: names.map((name) => ({name, value}))}]
                            : names.map((name) => ({
                                  type,
                                  name,
                                  grouping: false,
                                  data: [{x: 1, y: value}],
                              })),
                },
            };
        }
        const data = makeData(['Plan', 'Actual'], 40);
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
            zoomState: {},
        };
        try {
            const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
            await waitFor(() => expect(result.current.shapesReady).toBe(true));
            const original = result.current.allPreparedSeries ?? [];
            const planId = original.find((series) => series.name === 'Plan')?.legend.groupId ?? '';
            const actualId =
                original.find((series) => series.name === 'Actual')?.legend.groupId ?? '';
            act(() =>
                result.current.handleLegendItemClick({id: planId, name: 'Plan', metaKey: true}),
            );
            await waitFor(() => expect(result.current.activeLegendItems).toEqual([actualId]));
            rerender({
                ...props,
                data: {
                    ...makeData(['Actual', 'Plan'], 50),
                    legend: {enabled: true, position: 'top'},
                },
            });
            await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(original));
            expect(
                result.current.preparedSeries
                    .filter((series) => series.visible)
                    .map((series) => series.name),
            ).toEqual(['Actual']);
            const nextPlanId =
                result.current.preparedSeries.find((series) => series.name === 'Plan')?.legend
                    .groupId ?? '';
            act(() =>
                result.current.handleLegendItemClick({id: nextPlanId, name: 'Plan', metaKey: true}),
            );
            await waitFor(() =>
                expect(result.current.preparedSeries.every((series) => series.visible)).toBe(true),
            );
        } finally {
            getContext.mockRestore();
        }
    },
);

test('preserves legend selection references across view updates and invalidates on selection changes', async () => {
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        measureText: (text: string) => ({
            width: text.length * 6,
            fontBoundingBoxAscent: 10,
            fontBoundingBoxDescent: 2,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: text.length * 6,
        }),
    } as CanvasRenderingContext2D);
    const data: ChartData = {
        legend: {enabled: true},
        xAxis: {type: 'datetime'},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Dates',
                    legend: {groupId: 'dates'},
                    data: [
                        {x: 0, y: 1},
                        {x: 1, y: 2},
                        {x: 2, y: 3},
                    ],
                },
            ],
        },
    };
    let props: Parameters<typeof useChartInnerProps>[0] = {
        data,
        width: 600,
        height: 400,
        clipPathId: 'test',
        dispatcher: dispatch(),
        htmlLayout: null,
        plotNode: null,
        updateRangeSliderState: jest.fn(),
        updateZoomState: jest.fn(),
        zoomState: {},
    };

    try {
        const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.shapesReady).toBe(true));
        const activeLegendItems = result.current.activeLegendItems;
        const allPreparedSeries = result.current.allPreparedSeries;
        expect(activeLegendItems).toEqual(['dates']);

        const viewUpdates: Partial<typeof props>[] = [
            {width: 800},
            {zoomState: {x: [1, 2]}},
            {zoomState: {}, rangeSliderState: {min: 0, max: 1}},
        ];
        for (const update of viewUpdates) {
            const previousShapes = result.current.shapesData;
            props = {...props, ...update};
            rerender(props);
            await waitFor(() => expect(result.current.shapesData).not.toBe(previousShapes));
            expect(result.current.activeLegendItems).toBe(activeLegendItems);
            expect(result.current.allPreparedSeries).toBe(allPreparedSeries);
        }

        act(() => {
            result.current.handleLegendItemClick({id: 'dates', name: 'Dates', metaKey: true});
        });
        await waitFor(() => expect(result.current.activeLegendItems).toEqual([]));
        expect(result.current.activeLegendItems).not.toBe(activeLegendItems);

        const nextData: ChartData = {
            ...data,
            series: {data: [{...data.series.data[0], visible: false}]},
        };
        rerender({...props, data: nextData});
        await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(allPreparedSeries));
    } finally {
        getContext.mockRestore();
    }
});

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
