import {preparePieSeries} from '../../../../plugins/pie/prepare-pie-series';
import type {PieSeries} from '../../../../types';
import {getPreparedLegend} from '../../../series/prepare-legend';
import * as textUtils from '../../../utils/text';
import {getTooltipData} from '../get-tooltip-data';
import {preparePieData} from '../prepare-data';

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

test('a prepared donut has no tooltip hit inside its unpainted hole', async () => {
    const config: PieSeries = {
        type: 'pie',
        radius: 100,
        innerRadius: 70,
        dataLabels: {enabled: false},
        data: [{name: 'Slice', value: 1}],
    };
    const legend = await getPreparedLegend({
        legend: {enabled: false},
        series: [config],
        chartWidth: 300,
        chartMargin: {left: 0, right: 0, top: 0, bottom: 0},
    });
    const series = preparePieSeries({series: [config], legend, colors: ['#000']}).filter(
        (item) => item.type === 'pie',
    );
    const data = await preparePieData({series, boundsWidth: 300, boundsHeight: 300});
    const args = {data, boundsWidth: 300, boundsHeight: 300, measureDistance: true};
    expect(getTooltipData({...args, position: [150, 150]}).chunks).toEqual([]);
    expect(getTooltipData({...args, position: [219, 150]}).chunks).toEqual([]);
    const {chunks} = getTooltipData({...args, position: [230, 150]});
    expect(chunks[0].series.name).toBe('Slice');
    expect(chunks[0].distance).toBe(0);
    expect(
        getTooltipData({...args, position: [230, 150], measureDistance: false}).chunks[0].distance,
    ).toBeUndefined();
});
