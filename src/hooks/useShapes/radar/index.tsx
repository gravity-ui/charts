import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderRadar} from '~core/shapes/radar/renderer';
import type {PreparedRadarData} from '~core/shapes/radar/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

const b = block('radar');

type PrepareRadarSeriesArgs = {
    htmlLayout: HTMLElement | null;
    series: PreparedRadarData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export function RadarSeriesShapes(args: PrepareRadarSeriesArgs) {
    const {dispatcher, series: preparedData, seriesOptions, htmlLayout} = args;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderRadar({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlElements = preparedData.map((d) => d.htmlLabels).flat();

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={{htmlElements}} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
