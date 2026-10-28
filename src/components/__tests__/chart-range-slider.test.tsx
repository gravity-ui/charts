/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {waitFor} from '@testing-library/react';

import {DAY} from '~core/constants';

import type {ChartAxisRangeSlider, ChartData} from '../../types';
import {Chart} from '../index';

import {renderChart} from './utils';

function getData(rangeSlider: ChartAxisRangeSlider): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Series 1',
                    data: Array.from({length: 10}, (_, i) => ({x: i * DAY, y: i + 1})),
                },
            ],
        },
        xAxis: {type: 'datetime', rangeSlider},
    };
}

function getPlotBarCount(container: HTMLElement) {
    return container.querySelectorAll('.gcharts-chart__content .gcharts-bar-x__segment').length;
}

describe('Chart/rangeSlider', () => {
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
    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    test('turning the range slider on again applies its default range', async () => {
        const defaultRange = {size: 'P2D'};
        const {container, rerender} = renderChart(
            <Chart data={getData({enabled: true, defaultRange})} />,
        );
        const update = (rangeSlider: ChartAxisRangeSlider) =>
            rerender(
                <ThemeProvider theme="light">
                    <Chart data={getData(rangeSlider)} />
                </ThemeProvider>,
            );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));

        update({enabled: false, defaultRange});
        await waitFor(() => expect(getPlotBarCount(container)).toBe(10));

        update({enabled: true, defaultRange});
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));
    });
});
