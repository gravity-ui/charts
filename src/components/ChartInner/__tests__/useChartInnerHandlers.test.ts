/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import type React from 'react';

import {renderHook} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import {EventType} from '../../../core/utils';
import * as interaction from '../../../core/utils/chart-interaction';
import * as closest from '../../../core/utils/get-closest-data';
import type {ChartInteractionItem, ChartLegacyClickData} from '../../../types';
import {useChartInnerHandlers} from '../useChartInnerHandlers';

const hit: ChartInteractionItem<{x: number; y: number}, 'bar-x'> = {
    point: {x: 1, y: 2},
    series: {type: 'bar-x', id: 'bar', name: 'Bar'},
};

afterEach(() => jest.restoreAllMocks());

test.each(['tooltip', 'plot'] as const)(
    '%s clicks compute targets only on first read and retain the result',
    (clickMode) => {
        const getTargets = jest.spyOn(interaction, 'getChartTargets').mockReturnValue([hit]);
        jest.spyOn(closest, 'getClosestPoints').mockReturnValue([
            {data: hit.point, series: {...hit.series, data: [hit.point]}, closest: true},
        ]);
        const dispatcher = dispatch(EventType.CLICK_CHART);
        const listener = jest.fn<void, [Required<ChartLegacyClickData>]>();
        dispatcher.on(EventType.CLICK_CHART, listener);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const props: Parameters<typeof useChartInnerHandlers>[0] = {
            clickMode,
            dispatcher,
            svgContainer: svg,
            chartApi: {getClosest: () => null},
            boundsWidth: 100,
            boundsHeight: 100,
            boundsOffsetLeft: 0,
            boundsOffsetTop: 0,
            shapesData: [],
            layerIndexes: new Map(),
            tooltipPinned: false,
            togglePinTooltip: jest.fn(),
            unpinTooltip: jest.fn(),
            xAxis: null,
            yAxis: [],
            tooltipThrottle: 0,
            resetKey: {seriesData: undefined, axes: []},
        };
        const {result, rerender, unmount} = renderHook(useChartInnerHandlers, {
            initialProps: props,
        });
        const event = {
            clientX: 20,
            clientY: 30,
            nativeEvent: new MouseEvent('click'),
        } as React.MouseEvent<SVGSVGElement>;
        result.current.handleChartClick(event);
        const payload = listener.mock.calls[0][0];
        expect(payload.point).toBe(hit.point);
        expect(Object.keys(payload)).toContain('targets');
        expect(getTargets).not.toHaveBeenCalled();

        // The getter uses coordinates captured at dispatch, even if the wrapper changes later.
        Object.assign(event, {clientX: 90, clientY: 90});
        const targets = payload.targets;
        expect(targets).toEqual([hit]);
        expect(getTargets).toHaveBeenCalledWith(svg, [20, 30]);
        expect({...payload}.targets).toBe(targets);
        expect(JSON.parse(JSON.stringify(payload)).targets).toEqual([hit]);
        expect(getTargets).toHaveBeenCalledTimes(1);

        getTargets.mockReturnValue([]);
        rerender({...props, boundsWidth: 200});
        expect(payload.targets).toBe(targets);
        result.current.handleChartClick(event);
        const emptyPayload = listener.mock.calls[1][0];
        expect(getTargets).toHaveBeenCalledTimes(1);
        expect({...emptyPayload}.targets).toEqual([]);
        const emptyTargets = emptyPayload.targets;
        expect(getTargets).toHaveBeenCalledTimes(2);
        unmount();
        expect(payload.targets).toBe(targets);
        expect(emptyPayload.targets).toBe(emptyTargets);
        expect(getTargets).toHaveBeenCalledTimes(2);
    },
);
