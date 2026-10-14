import {scaleOrdinal} from 'd3-scale';

import {prepareScatterSeries} from '../../../../plugins/scatter/prepare-scatter-series';
import type {ScatterSeries} from '../../../../types';
import {getPreparedLegend} from '../../../series/prepare-legend';
import * as symbolGeometry from '../../../utils/symbol-geometry';
import * as textUtils from '../../../utils/text';
import {getTooltipData} from '../get-tooltip-data';
import type {PreparedScatterData} from '../types';

beforeEach(() => {
    jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(async () => ({
        width: 0,
        height: 0,
        hangingOffset: 0,
        inkBounds: {x: 0, width: 0},
    }));
});

afterEach(() => {
    jest.restoreAllMocks();
});

async function prepare(config: ScatterSeries): Promise<PreparedScatterData[]> {
    const legend = await getPreparedLegend({
        legend: {enabled: false},
        series: [config],
        chartWidth: 300,
        chartMargin: {left: 0, right: 0, top: 0, bottom: 0},
    });
    const [series] = prepareScatterSeries({
        series: [config],
        colorScale: scaleOrdinal<string, string>().range(['#000']),
        colors: ['#000'],
        legend,
    });
    return series.data.map((data) => ({
        point: {
            x: Number(data.x),
            y: Number(data.y),
            data,
            series,
            opacity: null,
            color: series.color,
        },
        active: true,
        hovered: false,
        clipped: false,
        htmlElements: [],
    }));
}

test('a larger circle containing the pointer beats a closer small center', async () => {
    const data = await prepare({
        type: 'scatter',
        name: 'Scatter',
        symbolType: 'circle',
        data: [
            {x: 150, y: 152, radius: 1},
            {x: 155, y: 150, radius: 10},
        ],
    });
    data[0].point.series.marker.states.normal.borderWidth = 0;
    const {chunks} = getTooltipData({
        data,
        position: [150, 150],
        boundsWidth: 300,
        boundsHeight: 300,
        measureDistance: true,
    });
    expect(chunks[0].data).toBe(data[1].point.data);
    expect(chunks[0].distance).toBe(0);
});

test('single-type selection keeps its center lookup and skips contour measurement', async () => {
    const data = await prepare({
        type: 'scatter',
        name: 'Scatter',
        symbolType: 'circle',
        data: [
            {x: 150, y: 152, radius: 1},
            {x: 155, y: 150, radius: 10},
        ],
    });
    const measure = jest.spyOn(symbolGeometry, 'getDistanceToSymbol');
    const {chunks} = getTooltipData({
        data,
        position: [150, 150],
        boundsWidth: 300,
        boundsHeight: 300,
        measureDistance: false,
    });
    expect(chunks[0].data).toBe(data[0].point.data);
    expect(chunks[0].distance).toBeUndefined();
    expect(measure).not.toHaveBeenCalled();
});
