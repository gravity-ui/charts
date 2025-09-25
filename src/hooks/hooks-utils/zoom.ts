import type {
    ChartAxisType,
    // ChartSeries,
    ChartSeriesData,
    ChartXAxis,
    ChartYAxis,
} from '../../types';
import type {PreparedSeries, PreparedSeriesWithAxes} from '../useSeries/types';
import type {ZoomState} from '../useZoom/types';

import {SERIES_TYPES_WITH_AXES} from './constants';

// eslint-disable-next-line complexity
function isValueInRange(args: {
    axis?: ChartXAxis | ChartYAxis;
    value?: number | string;
    min: number | string;
    max: number | string;
}) {
    const {axis, max, min, value} = args;

    if (value === undefined) {
        return false;
    }

    const axisType: ChartAxisType = axis?.type || 'linear';

    switch (axisType) {
        case 'datetime':
        case 'linear':
        case 'logarithmic': {
            const numValue = typeof value === 'string' ? Number(value) : value;
            const numMin = typeof min === 'string' ? Number(min) : min;
            const numMax = typeof max === 'string' ? Number(max) : max;

            if (Number.isNaN(numValue) || Number.isNaN(numMin) || Number.isNaN(numMax)) {
                return false;
            }

            return numValue >= numMin && numValue <= numMax;
        }
        case 'category': {
            const categories = axis?.categories || [];

            if (typeof value === 'string' && typeof min === 'number' && typeof max === 'number') {
                const valueIndex = categories.indexOf(value);

                if (min === -1 || max === -1 || valueIndex === -1) {
                    return false;
                }

                return valueIndex >= Math.min(min, max) && valueIndex <= Math.max(min, max);
            }

            if (typeof value === 'number' && typeof min === 'number' && typeof max === 'number') {
                if (min === -1 || max === -1) {
                    return false;
                }

                return value >= Math.min(min, max) && value <= Math.max(min, max);
            }

            return false;
        }
        default: {
            return false;
        }
    }
}

export function getZoomedSeriesData(args: {
    seriesData: PreparedSeries[];
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis;
    yAxes?: ChartYAxis[];
}) {
    const {seriesData, xAxis, yAxes, zoomState} = args;

    if (Object.keys(zoomState).length <= 0) {
        return {preparedZoomedSeries: seriesData, preparedShapeZoomedSeries: seriesData};
    }

    const seriesDataWithAxes = seriesData.filter((seriesItem) =>
        SERIES_TYPES_WITH_AXES.includes(seriesItem.type),
    ) as PreparedSeriesWithAxes[];

    const preparedZoomedSeries: PreparedSeries[] = [];
    const preparedShapeZoomedSeries: PreparedSeries[] = [];

    seriesDataWithAxes.forEach((seriesItem) => {
        const filteredData: ChartSeriesData[] = [];
        const filteredShapesData: ChartSeriesData[] = [];
        let prevPointInRange = false;
        let currentPointInRange = false;

        seriesItem.data.forEach((point, i) => {
            const prevPoint = seriesItem.data[i - 1];
            let inXRange = true;
            let inYRange = true;
            prevPointInRange = currentPointInRange;

            // - Предыдущая точка входит, текущая входит
            // - Предыдущая точка входит, текущая не входит // добавить в filteredData
            // - Предыдущая точка не входит, текущая входит // добавить в filteredData
            // - Предыдущая точка не входит, текущая не входит
            if (zoomState.x) {
                const [xMin, xMax] = zoomState.x;
                const x = 'x' in point ? point.x : undefined;
                inXRange = isValueInRange({
                    axis: xAxis,
                    value: x,
                    min: xMin,
                    max: xMax,
                });
            }

            if (zoomState.y) {
                const yAxisIndex =
                    'yAxis' in seriesItem && typeof seriesItem.yAxis === 'number'
                        ? seriesItem.yAxis
                        : 0;
                const [yMin, yMax] = zoomState.y[yAxisIndex];
                const y = 'y' in point ? point.y : undefined;
                inYRange = isValueInRange({
                    axis: yAxes?.[yAxisIndex],
                    value: y,
                    min: yMin,
                    max: yMax,
                });
            }

            currentPointInRange = inXRange && inYRange;

            // console.log(point.x, {prevPointInRange, currentPointInRange, prevPoint, point});

            if (currentPointInRange) {
                filteredData.push(point);
            }

            if (prevPointInRange && !currentPointInRange) {
                filteredShapesData.push(point);
            } else if (prevPoint && !prevPointInRange && currentPointInRange) {
                filteredShapesData.push(prevPoint, point);
            } else if (prevPoint && prevPointInRange && currentPointInRange) {
                filteredShapesData.push(prevPoint, point);
            }
        });

        preparedZoomedSeries.push({
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredData,
        } as PreparedSeries);
        preparedShapeZoomedSeries.push({
            ...(seriesItem as Omit<PreparedSeries, 'data'>),
            data: filteredShapesData,
        } as PreparedSeries);
    });
    // console.log({preparedZoomedSeries, preparedShapeZoomedSeries});
    return {preparedZoomedSeries, preparedShapeZoomedSeries};
}

// @ts-ignore
const _originalData = {
    series: {
        data: [
            {
                type: 'waterfall',
                data: [
                    {
                        y: 97,
                        x: '2024',
                    },
                    {
                        y: 10,
                        x: 'revenue',
                    },
                    {
                        y: -20,
                        x: 'fixed costs',
                    },
                    {
                        y: -15,
                        x: 'cost price',
                    },
                    {
                        total: true,
                        x: '2025',
                    },
                ],
                name: 'Profit',
                legend: {
                    itemText: {
                        positive: 'income',
                        negative: 'outcome',
                        totals: 'totals',
                    },
                },
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['2024', 'revenue', 'fixed costs', 'cost price', '2025'],
        labels: {
            autoRotation: false,
        },
    },
    legend: {
        enabled: true,
    },
};
// @ts-ignore
const _preparedData = [
    {
        x: 66.96484375,
        y: 42.53625000000001,
        width: 50,
        height: 131.31374999999997,
        opacity: null,
        data: {
            y: 97,
            x: '2024',
            index: 0,
        },
        series: {
            id: 'gravity-chart.6g2by',
            color: '#8AD554',
            type: 'waterfall',
            name: 'income',
            visible: true,
            legend: {
                enabled: true,
                symbol: {
                    shape: 'symbol',
                    symbolType: 'circle',
                    width: 8,
                    padding: 5,
                },
            },
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontColor: 'var(--gcharts-data-labels)',
                },
                allowOverlap: false,
                padding: 5,
                html: false,
            },
            cursor: null,
            data: [
                null,
                {
                    y: 10,
                    x: 'revenue',
                    index: 1,
                },
            ],
        },
        subTotal: 97,
        htmlElements: [],
        label: {
            text: '97',
            x: 91.96484375,
            y: 37.53625000000001,
            size: {
                width: 12.234375,
                height: 13,
            },
            textAnchor: 'middle',
        },
    },
    {
        x: 250.89453125,
        y: 28.998750000000015,
        width: 50,
        height: 13.537499999999994,
        opacity: null,
        subTotal: 107,
        htmlElements: [],
        label: {
            text: '10',
            x: 275.89453125,
            y: 23.998750000000015,
            size: {
                width: 12.234375,
                height: 13,
            },
            textAnchor: 'middle',
        },
    },
    {
        x: 434.82421875,
        y: 28.998750000000015,
        width: 50,
        height: 27.07499999999999,
        opacity: null,
        data: {
            y: -20,
            x: 'fixed costs',
            index: 2,
        },
        series: {
            id: 'gravity-chart.usjf5',
            color: '#FF3D64',
            type: 'waterfall',
            name: 'outcome',
            visible: true,
            cursor: null,
            data: [
                null,
                {
                    y: -15,
                    x: 'cost price',
                    index: 3,
                },
            ],
        },
        subTotal: 87,
        htmlElements: [],
        label: {
            text: '-20',
            x: 459.82421875,
            y: 74.07375,
            size: {
                width: 16.7109375,
                height: 13,
            },
            textAnchor: 'middle',
        },
    },
    {
        x: 618.75390625,
        y: 56.073750000000004,
        width: 50,
        height: 20.306250000000006,
        opacity: null,
        subTotal: 72,
        htmlElements: [],
        label: {
            text: '-15',
            x: 643.75390625,
            y: 94.38000000000001,
            size: {
                width: 16.7109375,
                height: 13,
            },
            textAnchor: 'middle',
        },
    },
    {
        x: 802.68359375,
        y: 76.38000000000001,
        width: 50,
        height: 97.46999999999998,
        opacity: null,
        data: {
            total: true,
            x: '2025',
            index: 4,
        },
        series: {
            id: 'gravity-chart.i9won',
            color: '#4DA2F1',
            type: 'waterfall',
            name: 'totals',
            visible: true,
            cursor: null,
            data: [null],
        },
        subTotal: 72,
        htmlElements: [],
        label: {
            text: '72',
            x: 827.68359375,
            y: 71.38000000000001,
            size: {
                width: 12.234375,
                height: 13,
            },
            textAnchor: 'middle',
        },
    },
];
