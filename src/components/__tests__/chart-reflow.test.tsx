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
});
