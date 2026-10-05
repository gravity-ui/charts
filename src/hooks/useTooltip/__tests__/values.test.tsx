/** @jest-environment jsdom */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {act, render} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import {getSeriesPlugin} from '~core/series/seriesRegistry';

import {ChartTooltipContent} from '../../../components/Tooltip/ChartTooltipContent';
import {TooltipValuesContext} from '../../../components/Tooltip/TooltipValuesContext';
import type {TooltipDataChunkLine} from '../../../types';
import type {PreparedTooltip} from '../../types';
import {useTooltip} from '../index';

it('resolves each hovered value once for sorting and totals, then reuses it on render', () => {
    const dispatcher = dispatch('hover-shape');
    const tooltip = {
        enabled: true,
        sorting: {key: 'value', direction: 'asc'},
    } as PreparedTooltip;
    const getValue = jest.spyOn(getSeriesPlugin('line').tooltip, 'getValue');
    const totalFormatter = jest.fn(({value}) => String(value));
    const hovered: TooltipDataChunkLine[] = [
        {data: {x: 0, y: 30}, series: {type: 'line', id: 'large', name: 'Large'}},
        {data: {x: 0, y: 10}, series: {type: 'line', id: 'small', name: 'Small'}},
    ];
    function TestTooltip() {
        const state = useTooltip({dispatcher, tooltip});
        return (
            <ThemeProvider theme="light">
                <TooltipValuesContext.Provider
                    value={
                        state.hovered && {hovered: state.hovered, values: state.hoveredValues ?? []}
                    }
                >
                    <ChartTooltipContent
                        hovered={state.hovered}
                        totals={{
                            enabled: true,
                            valueFormat: {type: 'custom', formatter: totalFormatter},
                        }}
                    />
                </TooltipValuesContext.Provider>
            </ThemeProvider>
        );
    }
    try {
        const {rerender} = render(<TestTooltip />);
        act(() => dispatcher.call('hover-shape', undefined, hovered, [10, 20]));
        expect(getValue).toHaveBeenCalledTimes(2);
        expect(totalFormatter).toHaveBeenCalledWith({value: 40});
        rerender(<TestTooltip />);
        expect(getValue).toHaveBeenCalledTimes(2);
        // A subsequent pointer event keeps the same chunks and still computes each value only once.
        getValue.mockClear();
        act(() => dispatcher.call('hover-shape', undefined, hovered, [11, 21]));
        expect(getValue).toHaveBeenCalledTimes(2);
    } finally {
        getValue.mockRestore();
    }
});
