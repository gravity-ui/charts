import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderSankey} from '~core/shapes/sankey/renderer';
import type {PreparedSankeyData} from '~core/shapes/sankey/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

const b = block('sankey');

type ShapeProps = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedSankeyData;
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const SankeySeriesShape = (props: ShapeProps) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = props;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderSankey({plot: ref.current}, preparedData, seriesOptions, dispatcher);
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
