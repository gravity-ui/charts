import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import {interpolateRgb} from 'd3';

import {Chart} from '../../../components';
import {DEFAULT_PALETTE} from '../../../constants';
import type {ChartData, HeatmapSeriesData, MeaningfulAny} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartData {
    const data = marsWeatherData as MeaningfulAny[];
    const months = Array.from(
        new Set(
            data.map((d) => {
                return dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).format('MMMM');
            }),
        ),
    );

    const maxTemp = Math.max(...data.map((d) => Math.abs(d.max_temp)));
    const colors = [DEFAULT_PALETTE[1], DEFAULT_PALETTE[0]];
    const getColor = interpolateRgb(colors[0], colors[1]);

    const seriesData: HeatmapSeriesData[] = data.map((d) => {
        const date = dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'});
        const colorValue = -d.max_temp / maxTemp;
        return {
            x: date.date(),
            y: months.indexOf(date.format('MMMM')),
            label: `${d.max_temp}°C`,
            value: -d.max_temp,
            custom: {
                ...d,
                colorValue,
            },
            color: getColor(colorValue),
        };
    });

    return {
        title: {
            text: `Mars max temperature in ${dateTime({input: data[0].terrestrial_date, format: 'YYYY-MM-DD'}).format('YYYY')}`,
        },
        series: {
            data: [
                {
                    type: 'heatmap',
                    data: seriesData,
                    name: 'Mars weather',
                    dataLabels: {
                        enabled: true,
                        style: {fontWeight: 'normal', fontSize: '9px'},
                        html: true,
                    },
                    borderColor: '#fff',
                    borderWidth: 1,
                },
            ],
        },
        xAxis: {type: 'linear'},
        yAxis: [
            {
                type: 'category',
                categories: months,
            },
        ],
        legend: {
            enabled: true,
            type: 'continuous',
            colorScale: {
                colors: colors,
                stops: [0, 1],
            },
        },
        tooltip: {
            renderer: ({hovered}) => {
                const cellData = hovered[0]?.data as HeatmapSeriesData;
                const itemChartData: ChartData = {
                    title: {
                        text: dateTime({
                            input: cellData.custom.terrestrial_date,
                            format: 'YYYY-MM-DD',
                        }).format('DD MMM'),
                    },
                    series: {
                        data: [
                            {
                                type: 'bar-x',
                                name: 'Series 1',
                                color: cellData.color,
                                data: [
                                    {x: 'min temp', y: -cellData.custom.min_temp},
                                    {x: 'max temp', y: -cellData.custom.max_temp},
                                ],
                                dataLabels: {enabled: true},
                            },
                        ],
                    },
                    yAxis: [{visible: false, maxPadding: 0.25}],
                    xAxis: {
                        grid: {enabled: false},
                        type: 'category',
                        categories: ['min temp', 'max temp'],
                    },
                };
                return (
                    <div style={{margin: 20, width: 200}}>
                        <div style={{height: 180}}>
                            <Chart key="chart" data={itemChartData} />
                        </div>
                        <div style={{marginTop: 8, whiteSpace: 'normal'}}>
                            Some additional information (the chart is based on the data in the cell)
                        </div>
                    </div>
                );
            },
        },
    };
}

export const heatmapPlaygroundData = prepareData();
