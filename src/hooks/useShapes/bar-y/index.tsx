import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderBarY} from '~core/shapes/bar-y/renderer';
import type {BarYShapesArgs} from '~core/shapes/bar-y/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareBarYData} from '~core/shapes/bar-y/prepare-data';

const b = block('bar-y');

type Args = {
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    preparedData: BarYShapesArgs;
    seriesOptions: PreparedSeriesOptions;
    dispatcher?: Dispatch<object>;
};

export function BarYSeriesShapes(args: Args) {
    const {
        dispatcher,
        preparedData: {htmlLabels: htmlElements},
        seriesOptions,
        htmlLayout,
        clipPathId,
    } = args;
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderBarY({plot: ref.current}, args.preparedData, seriesOptions, dispatcher);
    }, [args.preparedData, dispatcher, seriesOptions]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} clipPath={`url(#${clipPathId})`} />
            <HtmlLayer preparedData={{htmlElements}} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
