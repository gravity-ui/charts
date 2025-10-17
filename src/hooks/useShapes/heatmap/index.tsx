import React from 'react';

import {select} from 'd3';
import type {Dispatch} from 'd3';
import get from 'lodash/get';

import {block} from '../../../utils';
import type {PreparedSeriesOptions} from '../../useSeries/types';
import {HtmlLayer} from '../HtmlLayer';

import type {PreparedHeatmapData} from './types';

export {prepareHeatmapData} from './prepare-data';
export * from './types';

const b = block('heatmap');

type Args = {
    dispatcher: Dispatch<object>;
    preparedData: PreparedHeatmapData[];
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const HeatmapSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const hoveredDataRef = React.useRef<PreparedHeatmapData[] | null | undefined>(null);
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        const svgElement = select(ref.current);
        const hoverOptions = get(seriesOptions, 'heatmap.states.hover');
        const inactiveOptions = get(seriesOptions, 'heatmap.states.inactive');
        svgElement.selectAll('*').remove();

        function handleShapeHover(data?: PreparedHeatmapData[]) {
            hoveredDataRef.current = data;
            const hoverEnabled = hoverOptions?.enabled;
            const inactiveEnabled = inactiveOptions?.enabled;

            if (inactiveEnabled) {
                // ToDo: do something
            }

            if (hoverEnabled) {
                // ToDo: do something
            }
        }

        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }

        dispatcher.on('hover-shape.heatmap', handleShapeHover);

        return () => {
            dispatcher.on('hover-shape.heatmap', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
