import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderXRange} from '~core/shapes/x-range/renderer';
import type {PreparedXRangeData} from '~core/shapes/x-range/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareXRangeData} from '~core/shapes/x-range/prepare-data';
export type {PreparedXRangeData} from '~core/shapes/x-range/types';

const b = block('x-range');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: PreparedXRangeData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export function XRangeSeriesShapes(args: Args) {
    const {dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId} = args;
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderXRange({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(
        () => ({htmlElements: preparedData.flatMap((d) => d.htmlLabels)}),
        [preparedData],
    );

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
