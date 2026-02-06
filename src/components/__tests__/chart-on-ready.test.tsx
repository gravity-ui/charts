/**
 * @jest-environment jsdom
 */
import React from 'react';

import {render, waitFor} from '@testing-library/react';

import type {ChartData} from '../../types';
import {Chart} from '../index';

function createSizedContainer(width: number, height: number) {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', {value: width, configurable: true});
    Object.defineProperty(container, 'clientHeight', {value: height, configurable: true});
    document.body.appendChild(container);

    return container;
}

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

        const container = createSizedContainer(800, 400);
        render(<Chart data={data} onReady={onReady} />, {container});

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

        const container = createSizedContainer(800, 400);
        render(<Chart data={data} onReady={onReady} />, {container});

        await waitFor(() => {
            expect(onReady).toHaveBeenCalledTimes(1);
        });
    });
});
