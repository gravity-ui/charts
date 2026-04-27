import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderFunnel} from '~core/shapes/funnel/renderer';
import type {PreparedFunnelData} from '~core/shapes/funnel/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareFunnelData} from '~core/shapes/funnel/prepare-data';
export * from '~core/shapes/funnel/types';

const b = block('funnel');

type Args = {
    dispatcher?: Dispatch<object>;
    preparedData: PreparedFunnelData;
    seriesOptions: PreparedSeriesOptions;
    htmlLayout: HTMLElement | null;
};

export const FunnelSeriesShapes = (args: Args) => {
    const {dispatcher, htmlLayout, preparedData, seriesOptions} = args;
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderFunnel({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(
        () => ({htmlElements: preparedData.htmlLabels}),
        [preparedData.htmlLabels],
    );

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
};
