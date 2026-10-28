/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {act, renderHook, waitFor} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import {getPreparedRangeSlider} from '~core/axes/range-slider';
import {DAY} from '~core/constants';

import type {PreparedAreaData} from '../../../core/shapes/area/types';
import type {PreparedBarXData} from '../../../core/shapes/bar-x/types';
import type {PreparedBarYData} from '../../../core/shapes/bar-y/types';
import * as shapes from '../../../hooks/useShapes';
import type {ChartData} from '../../../types';
import * as gradientReference from '../prepareGradientReference';
import {useChartInnerProps} from '../useChartInnerProps';
import {useChartInnerState} from '../useChartInnerState';

describe('legend and domain updates', () => {
    beforeEach(() => {
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            measureText: (text: string) => ({
                width: text.length * 6,
                fontBoundingBoxAscent: 10,
                fontBoundingBoxDescent: 2,
                actualBoundingBoxLeft: 0,
                actualBoundingBoxRight: text.length * 6,
            }),
        } as CanvasRenderingContext2D);
    });
    afterEach(() => jest.restoreAllMocks());

    function getProps(data: ChartData): Parameters<typeof useChartInnerProps>[0] {
        return {
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
    }

    test.each([true, false])(
        'legend interaction overrides later visibility changes (explicit IDs: %s)',
        async (explicitIds) => {
            function makeData(visible: boolean): ChartData {
                return {
                    legend: {enabled: true},
                    series: {
                        data: ['A', 'B'].map((name) => ({
                            type: 'bar-x',
                            name,
                            visible,
                            legend: explicitIds ? {groupId: name} : undefined,
                            data: [{x: 1, y: 40}],
                        })),
                    },
                };
            }
            const props = getProps(makeData(true));
            const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
            await waitFor(() => expect(result.current.shapesReady).toBe(true));

            async function update(visible: boolean) {
                const previous = result.current.allPreparedSeries;
                rerender({...props, data: makeData(visible)});
                await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
            }

            await update(false);
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
                false,
                false,
            ]);
            const id = result.current.preparedSeries[0].legend.groupId;
            act(() => result.current.handleLegendItemClick({id, name: 'A', metaKey: true}));
            await waitFor(() => expect(result.current.activeLegendItems).toEqual([id]));
            await update(true);
            await update(false);
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
                true,
                false,
            ]);
        },
    );

    test.each(['global', 'series'] as const)(
        'restores selection after disabling the %s legend and updating data',
        async (scope) => {
            function makeData(enabled: boolean, value: number): ChartData {
                return {
                    legend: {enabled: scope === 'global' ? enabled : true},
                    series: {
                        data: ['A', 'B'].map((name) => ({
                            type: 'bar-x',
                            name,
                            legend: {
                                groupId: scope === 'global' ? name : undefined,
                                enabled: scope === 'series' && name === 'A' ? enabled : undefined,
                            },
                            data: [{x: 1, y: value}],
                        })),
                    },
                };
            }
            const props = getProps(makeData(true, 40));
            const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
            await waitFor(() => expect(result.current.shapesReady).toBe(true));
            const id = result.current.preparedSeries[0].legend.groupId;
            act(() => result.current.handleLegendItemClick({id, name: 'A', metaKey: true}));
            await waitFor(() => expect(result.current.preparedSeries[0].visible).toBe(false));

            async function update(enabled: boolean, value: number) {
                const previous = result.current.allPreparedSeries;
                rerender({...props, data: makeData(enabled, value)});
                await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
            }

            await update(false, 40);
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
                true,
                true,
            ]);
            await update(false, 50);
            if (scope === 'series') {
                const bId = result.current.preparedSeries[1].legend.groupId;
                act(() =>
                    result.current.handleLegendItemClick({id: bId, name: 'B', metaKey: true}),
                );
                await waitFor(() => expect(result.current.activeLegendItems).toEqual([]));
            }
            await update(true, 50);
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
                false,
                scope === 'global',
            ]);
        },
    );

    test.each([
        {type: 'bar-x', previousId: 'old', nextId: 'new'},
        {type: 'pie', previousId: 'old', nextId: 'new'},
        {type: 'funnel', previousId: 'old', nextId: 'new'},
        {type: 'bar-x', previousId: 'old', nextId: undefined},
        {type: 'bar-x', previousId: undefined, nextId: 'new'},
    ] as const)(
        '$type legend ID change from $previousId to $nextId creates a new visible item',
        async ({type, previousId, nextId}) => {
            function makeData(groupId: string | undefined): ChartData {
                const item = {name: 'Same', legend: {groupId}};
                return {
                    legend: {enabled: true},
                    series: {
                        data:
                            type === 'bar-x'
                                ? [{type, ...item, data: [{x: 1, y: 40}]}]
                                : [{type, data: [{...item, value: 40}]}],
                    },
                };
            }
            const props = getProps(makeData(previousId));
            const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
            await waitFor(() => expect(result.current.shapesReady).toBe(true));
            const id = result.current.preparedSeries[0].legend.groupId;
            act(() => result.current.handleLegendItemClick({id, name: 'Same', metaKey: true}));
            await waitFor(() => expect(result.current.activeLegendItems).toEqual([]));

            const previous = result.current.allPreparedSeries;
            rerender({...props, data: makeData(nextId)});
            await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
            expect(result.current.activeLegendItems).toEqual([
                result.current.preparedSeries[0].legend.groupId,
            ]);
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([true]);
        },
    );

    test('removes stale IDs, preserves surviving selection and uses visibility for new items', async () => {
        const a = {
            type: 'bar-x' as const,
            name: 'A',
            legend: {groupId: 'a'},
            data: [{x: 1, y: 40}],
        };
        const b = {...a, name: 'B', legend: {groupId: 'b'}};
        const c = {...a, name: 'C', legend: {groupId: 'c'}};
        const props = getProps({legend: {enabled: true}, series: {data: [a, b, c]}});
        const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.shapesReady).toBe(true));
        act(() => result.current.handleLegendItemClick({id: 'b', name: 'B', metaKey: true}));
        await waitFor(() => expect(result.current.activeLegendItems).toEqual(['a', 'c']));

        const previous = result.current.allPreparedSeries;
        rerender({
            ...props,
            data: {
                legend: {enabled: true},
                series: {
                    data: [
                        {...c, name: 'Renamed C'},
                        b,
                        {...a, name: 'D', legend: {groupId: 'd'}},
                        {...a, name: 'E', legend: {groupId: 'e'}, visible: false},
                    ],
                },
            },
        });
        await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
        expect(result.current.activeLegendItems).toEqual(['c', 'd']);
        expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
            true,
            false,
            true,
            false,
        ]);
    });

    test('a completely new dataset is visible after hiding every previous legend item', async () => {
        const a = {
            type: 'bar-x' as const,
            name: 'A',
            legend: {groupId: 'a'},
            data: [{x: 1, y: 40}],
        };
        const props = getProps({legend: {enabled: true}, series: {data: [a]}});
        const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.shapesReady).toBe(true));
        act(() => result.current.handleLegendItemClick({id: 'a', name: 'A', metaKey: true}));
        await waitFor(() => expect(result.current.activeLegendItems).toEqual([]));

        const previous = result.current.allPreparedSeries;
        rerender({
            ...props,
            data: {
                legend: {enabled: true},
                series: {
                    data: [
                        {...a, name: 'B', legend: {groupId: 'b'}},
                        {...a, name: 'C', legend: {groupId: 'c'}},
                    ],
                },
            },
        });
        await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
        expect(result.current.activeLegendItems).toEqual(['b', 'c']);
        expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([true, true]);
    });

    test.each([0, 1])(
        'reserves stable IDs when duplicate names reorder (hidden index %i)',
        async (hiddenIndex) => {
            const generated = {type: 'bar-x' as const, name: 'Same', data: [{x: 1, y: 40}]};
            const explicit = {...generated, legend: {groupId: 'stable'}};
            const props = getProps({
                legend: {enabled: true},
                series: {data: [generated, explicit]},
            });
            const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
            await waitFor(() => expect(result.current.shapesReady).toBe(true));
            const id = result.current.preparedSeries[hiddenIndex].legend.groupId;
            act(() => result.current.handleLegendItemClick({id, name: 'Same', metaKey: true}));
            await waitFor(() =>
                expect(result.current.preparedSeries[hiddenIndex].visible).toBe(false),
            );
            const previous = result.current.allPreparedSeries;
            rerender({
                ...props,
                data: {legend: {enabled: true}, series: {data: [explicit, generated]}},
            });
            await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual(
                hiddenIndex === 0 ? [true, false] : [false, true],
            );
        },
    );

    test('a new series without a legend item preserves restore-all clicks', async () => {
        const a = {
            type: 'bar-x' as const,
            name: 'A',
            legend: {groupId: 'a'},
            data: [{x: 1, y: 40}],
        };
        const b = {...a, name: 'B', legend: {groupId: 'b'}};
        const c = {...a, name: 'C', legend: {enabled: false}};
        const props = getProps({legend: {enabled: true}, series: {data: [a, b]}});
        const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.shapesReady).toBe(true));
        act(() => result.current.handleLegendItemClick({id: 'b', name: 'B', metaKey: false}));
        await waitFor(() => expect(result.current.activeLegendItems).toEqual(['b']));
        const previous = result.current.allPreparedSeries;
        rerender({...props, data: {legend: {enabled: true}, series: {data: [a, b, c]}}});
        await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
        expect(result.current.activeLegendItems).toEqual(['b']);
        act(() => result.current.handleLegendItemClick({id: 'b', name: 'B', metaKey: false}));
        await waitFor(() =>
            expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
                true,
                true,
                true,
            ]),
        );
    });

    test('reconciling generated IDs prepares shapes once per config update', async () => {
        const prepareShapes = jest.spyOn(shapes, 'getShapes');
        const props = getProps({
            series: {
                data: ['A', 'B'].map((name) => ({type: 'bar-x', name, data: [{x: 1, y: 40}]})),
            },
        });
        const {result, rerender} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.shapesReady).toBe(true));
        const id = result.current.preparedSeries[0].legend.groupId;
        act(() => result.current.handleLegendItemClick({id, name: 'A', metaKey: true}));
        await waitFor(() => expect(result.current.preparedSeries[0].visible).toBe(false));
        prepareShapes.mockClear();
        const previous = result.current.allPreparedSeries;
        rerender({...props, data: {...props.data, legend: {enabled: true, position: 'top'}}});
        await waitFor(() => expect(result.current.allPreparedSeries).not.toBe(previous));
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
        expect(prepareShapes).toHaveBeenCalledTimes(1);
        expect(result.current.preparedSeries.map((series) => series.visible)).toEqual([
            false,
            true,
        ]);
    });

    test.each(['bar-x', 'bar-y'] as const)(
        'duplicate %s segments fit inside the automatic domain',
        async (type) => {
            const props = getProps({
                series: {
                    data: [
                        {
                            type,
                            name: 'Bars',
                            stacking: 'normal',
                            data: [-100, -75].map((value) =>
                                type === 'bar-y' ? {x: value, y: 1} : {x: 1, y: value},
                            ),
                        },
                    ],
                },
            });
            const {result} = renderHook(useChartInnerProps, {initialProps: props});
            await waitFor(() => expect(result.current.shapesReady).toBe(true));
            expect(result.current.shapesData).toHaveLength(2);
            for (const shape of result.current.shapesData as (
                | PreparedBarXData
                | PreparedBarYData
            )[]) {
                expect(shape.x).toBeGreaterThanOrEqual(0);
                expect(shape.x + shape.width).toBeLessThanOrEqual(result.current.boundsWidth);
                expect(shape.y).toBeGreaterThanOrEqual(0);
                expect(shape.y + shape.height).toBeLessThanOrEqual(result.current.boundsHeight);
            }
        },
    );

    test('area domain excludes discarded duplicate points', async () => {
        const props = getProps({
            series: {
                data: [
                    {
                        type: 'area',
                        name: 'Area',
                        data: [
                            {x: 1, y: -100},
                            {x: 1, y: -75},
                        ],
                    },
                ],
            },
        });
        const {result} = renderHook(useChartInnerProps, {initialProps: props});
        await waitFor(() => expect(result.current.shapesReady).toBe(true));
        expect(
            Math.min(...(result.current.yScale?.[0]?.domain() ?? []).map(Number)),
        ).toBeGreaterThan(-100);
        const area = result.current.shapesData[0] as PreparedAreaData;
        expect(area.points.map((point) => point.data.y)).toEqual([-75]);
    });

    test.each([true, false])(
        'x domain is not limited by a range slider that the next data turns off (slider data prepared: %s)',
        async (sliderDataPrepared) => {
            const series: ChartData['series'] = {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Bars',
                        data: Array.from({length: 10}, (_, i) => ({x: i * DAY, y: i + 1})),
                    },
                ],
            };
            const sliderData: ChartData = {
                series,
                xAxis: {type: 'datetime', rangeSlider: {enabled: true}},
            };
            const plainData: ChartData = {series, xAxis: {type: 'datetime'}};
            const dispatcher = dispatch();
            const {result, rerender} = renderHook(
                ({data}: {data: ChartData}) => {
                    const {rangeSliderState, updateRangeSliderState, updateZoomState, zoomState} =
                        useChartInnerState({
                            dispatcher,
                            preparedRangeSlider: getPreparedRangeSlider({xAxis: data.xAxis}),
                        });
                    return {
                        updateRangeSliderState,
                        ...useChartInnerProps({
                            ...getProps(data),
                            dispatcher,
                            rangeSliderState,
                            updateRangeSliderState,
                            updateZoomState,
                            zoomState,
                        }),
                    };
                },
                {initialProps: {data: sliderData}},
            );
            const getXDomain = () => (result.current.xScale?.domain() ?? []).map(Number);
            // The chart sets the range slider state as soon as it renders the data.
            act(() => result.current.updateRangeSliderState({min: 8 * DAY, max: 9 * DAY}));
            if (sliderDataPrepared) {
                await waitFor(() => expect(getXDomain()[0]).toBeGreaterThan(7 * DAY));
            }

            rerender({data: plainData});
            await waitFor(() => expect(result.current.xAxis?.rangeSlider.enabled).toBe(false));
            expect(getXDomain()[0]).toBeLessThanOrEqual(0);
            expect(getXDomain()[1]).toBeGreaterThanOrEqual(9 * DAY);
        },
    );

    test.each(['bar-x', 'pie', 'funnel'] as const)(
        'preserves %s legend selection when config/data changes regenerate group IDs',
        async (type) => {
            function makeData(names: string[], value: number): ChartData {
                return {
                    legend: {enabled: true},
                    series: {
                        data:
                            type === 'bar-x'
                                ? names.map((name) => ({
                                      type,
                                      name,
                                      data: [{x: 1, y: value}],
                                  }))
                                : [{type, data: names.map((name) => ({name, value}))}],
                    },
                };
            }
            const data = makeData(['Plan', 'Actual'], 40);
            const props = getProps(data);
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
        },
    );
});

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
