/**
 * @jest-environment jsdom
 */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {waitFor} from '@testing-library/react';

import type {ChartData} from '../../types';
import {Chart} from '../index';

import {renderChart, timeout} from './utils';

describe('Chart/onReady', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should call onReady when chart renders with visible series', async () => {
        const onReady = jest.fn();
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

        renderChart(<Chart data={data} onReady={onReady} />);

        await waitFor(() => {
            expect(onReady).toHaveBeenCalledTimes(1);
        });
        expect(onReady).toHaveBeenCalledWith({
            dimensions: {width: 800, height: 400},
        });
    });

    test('should call onReady when all series are initially hidden', async () => {
        const onReady = jest.fn();
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Hidden Series',
                        visible: false,
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 2},
                        ],
                    },
                ],
            },
        };

        renderChart(<Chart data={data} onReady={onReady} />);

        await waitFor(() => {
            expect(onReady).toHaveBeenCalledTimes(1);
        });
    });

    test('should call onReady only once after re-renders', async () => {
        const onReady = jest.fn();
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

        const {rerender} = renderChart(<Chart data={data} onReady={onReady} />);

        await waitFor(() => {
            expect(onReady).toHaveBeenCalledTimes(1);
        });

        rerender(
            <ThemeProvider theme="light">
                <Chart data={data} onReady={onReady} />
            </ThemeProvider>,
        );

        // Give time for any potential extra calls to settle
        await timeout(200);
        expect(onReady).toHaveBeenCalledTimes(1);
    });
});
