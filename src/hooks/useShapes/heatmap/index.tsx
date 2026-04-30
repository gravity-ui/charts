import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderHeatmap} from '~core/shapes/heatmap/renderer';
import type {PreparedHeatmapData} from '~core/shapes/heatmap/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareHeatmapData} from '~core/shapes/heatmap/prepare-data';
export * from '~core/shapes/heatmap/types';

const b = block('heatmap');

type Args = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedHeatmapData;
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const HeatmapSeriesShapes = (args: Args) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderHeatmap({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer
                preparedData={{htmlElements: preparedData.htmlLabels}}
                htmlLayout={htmlLayout}
            />
        </React.Fragment>
    );
};
