/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {waitFor} from '@testing-library/react';

import {DAY} from '~core/constants';

import type {ChartAxisRangeSlider, ChartData, ChartXAxis} from '../../types';
import {Chart} from '../index';

import {renderChart} from './utils';

function getData(xAxis: ChartXAxis, getX = (index: number) => index * DAY): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Series 1',
                    data: Array.from({length: 10}, (_, i) => ({x: getX(i), y: i + 1})),
                },
            ],
        },
        xAxis,
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

    function renderUpdatableChart(data: ChartData) {
        const {container, rerender} = renderChart(<Chart data={data} />);
        const update = (nextData: ChartData) =>
            rerender(
                <ThemeProvider theme="light">
                    <Chart data={nextData} />
                </ThemeProvider>,
            );
        return {container, update};
    }

    test('the chart is ready with the default range already applied', async () => {
        const onReady = jest.fn();
        renderChart(
            <Chart
                data={getData({
                    type: 'datetime',
                    rangeSlider: {enabled: true, defaultRange: {size: 'P2D'}},
                })}
                onReady={() => onReady(getPlotBarCount(document.body))}
            />,
        );

        await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
        expect(onReady).toHaveBeenCalledWith(2);
    });

    test('a new default range is applied when it replaces data that is still being prepared', async () => {
        const getX = (i: number) => Date.UTC(2024, 0, 1) + i * DAY;
        const xAxis: ChartXAxis = {
            type: 'datetime',
            rangeSlider: {enabled: true, defaultRange: {size: 'P2D'}},
        };
        const {container, update} = renderUpdatableChart(getData(xAxis, getX));
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));

        // A data refresh starts a run that is replaced before its range slider check.
        update(getData(xAxis, getX));
        update(
            getData(
                {type: 'datetime', rangeSlider: {enabled: true, defaultRange: {size: 'P3D'}}},
                getX,
            ),
        );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(3));
    });

    test('turning the range slider on again applies its default range', async () => {
        const defaultRange = {size: 'P2D'};
        const getSliderData = (rangeSlider: ChartAxisRangeSlider) =>
            getData({type: 'datetime', rangeSlider});
        const {container, update} = renderUpdatableChart(
            getSliderData({enabled: true, defaultRange}),
        );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));

        update(getSliderData({enabled: false, defaultRange}));
        await waitFor(() => expect(getPlotBarCount(container)).toBe(10));

        update(getSliderData({enabled: true, defaultRange}));
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));
    });

    test('the range slider is initialized from the x range of the new data', async () => {
        const {container, update} = renderUpdatableChart(
            getData({type: 'datetime'}, (i) => Date.UTC(2020, 0, 1) + i * DAY),
        );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(10));

        update(
            getData(
                {type: 'datetime', rangeSlider: {enabled: true, defaultRange: {size: 'P2D'}}},
                (i) => Date.UTC(2024, 0, 1) + i * DAY,
            ),
        );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));
    });

    test('the range slider applies its default range after the x axis type changes', async () => {
        const {container, update} = renderUpdatableChart(
            getData({type: 'datetime', rangeSlider: {enabled: true, defaultRange: {size: 'P2D'}}}),
        );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(2));

        update(
            getData(
                {type: 'linear', rangeSlider: {enabled: true, defaultRange: {size: 5}}},
                (i) => i,
            ),
        );
        await waitFor(() => expect(getPlotBarCount(container)).toBe(5));
    });
});
