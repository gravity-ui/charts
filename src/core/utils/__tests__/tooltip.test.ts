import type {ChartSeries} from '../../../types';
import {TIME_UNITS} from '../time';
import {getDefaultTooltipHeaderFormat} from '../tooltip';

it.each(['bar-y', 'x-range'] as const)(
    'uses the %s plugin header axis for default formatting',
    (type) => {
        const series: ChartSeries =
            type === 'bar-y'
                ? {
                      type,
                      name: 'Series',
                      data: [
                          {x: 10, y: 0},
                          {x: 20, y: TIME_UNITS.day},
                      ],
                  }
                : {
                      type,
                      name: 'Series',
                      data: [
                          {x0: 10, x1: 20, y: 0},
                          {x0: 20, x1: 30, y: TIME_UNITS.day},
                      ],
                  };
        expect(
            getDefaultTooltipHeaderFormat({
                seriesData: [series],
                xAxis: {type: 'linear'},
                yAxes: [{type: 'datetime'}, {type: 'linear'}],
                dateTimeLabelFormats: {day: 'YYYY'},
            }),
        ).toEqual({type: 'date', format: 'YYYY'});
    },
);

it('retains default X header formatting for series with an X header', () => {
    expect(
        getDefaultTooltipHeaderFormat({
            seriesData: [{type: 'line', name: 'Series', data: [{x: 0, y: 10}]}],
            xAxis: {type: 'linear'},
            yAxes: [{type: 'datetime'}],
        }),
    ).toEqual({type: 'number'});
});
