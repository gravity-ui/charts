import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderPie} from '~core/shapes/pie/renderer';
import type {PreparedPieData} from '~core/shapes/pie/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {getHaloVisibility} from '~core/shapes/pie/renderer';

const b = block('pie');

type PreparePieSeriesArgs = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedPieData[];
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export function PieSeriesShapes(args: PreparePieSeriesArgs) {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = args;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderPie({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlElements = preparedData.map((d) => d.htmlLabels).flat();

    return (
        <React.Fragment>
            <g ref={ref} className={b()} style={{zIndex: 9}} />
            <HtmlLayer preparedData={{htmlElements}} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
