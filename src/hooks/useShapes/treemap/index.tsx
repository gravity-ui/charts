import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderTreemap} from '~core/shapes/treemap/renderer';
import type {PreparedTreemapData} from '~core/shapes/treemap/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

const b = block('treemap');

type ShapeProps = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedTreemapData;
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export const TreemapSeriesShape = (props: ShapeProps) => {
    const {dispatcher, preparedData, seriesOptions, htmlLayout} = props;
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderTreemap({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={preparedData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
