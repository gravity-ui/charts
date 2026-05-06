/**
 * @jest-environment jsdom
 */
import React from 'react';

import {act} from '@testing-library/react';

import type {ChartData} from '../../types';
import {Chart} from '../index';
import type {ChartRef} from '../index';

import {renderChart} from './utils';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Test Series',
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 2},
                ],
            },
        ],
    },
};

declare const __triggerResizeObserver: (target: Element) => void;

describe('Chart/reflow', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    test('reflow() triggers onResize after debounce delay', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();
        const ref = React.createRef<ChartRef>();

        renderChart(<Chart ref={ref} data={data} onResize={onResize} />);

        // wait for initial resize on mount
        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        ref.current?.reflow();

        // not called yet — still within debounce window
        expect(onResize).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('reflow({ immediate: true }) triggers onResize without waiting for debounce', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();
        const ref = React.createRef<ChartRef>();

        renderChart(<Chart ref={ref} data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        await act(async () => {
            ref.current?.reflow({immediate: true});
        });

        // called without advancing timers
        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('reflow({ immediate: true }) does not call debounced pending resize', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();
        const ref = React.createRef<ChartRef>();

        renderChart(<Chart ref={ref} data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        // schedule a debounced call
        ref.current?.reflow();
        expect(onResize).not.toHaveBeenCalled();

        // immediate call fires right away
        await act(async () => {
            ref.current?.reflow({immediate: true});
        });
        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('container resize (without window.resize) triggers onResize via ResizeObserver', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();

        const {container} = renderChart(<Chart data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        // simulate container width change (e.g. drawer drag)
        Object.defineProperty(container, 'clientWidth', {value: 600, configurable: true});

        act(() => {
            __triggerResizeObserver(container);
        });

        // not called yet — within debounce window
        expect(onResize).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        expect(onResize).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenCalledWith({
            dimensions: {width: 600, height: 400},
        });
    });

    test('ResizeObserver does not trigger onResize when dimensions stay the same', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();

        const {container} = renderChart(<Chart data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        act(() => {
            __triggerResizeObserver(container);
        });

        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        expect(onResize).not.toHaveBeenCalled();
    });
});
