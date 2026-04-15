import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeriesOptions} from '~core/series/types';
import {renderScatter} from '~core/shapes/scatter/renderer';
import type {PreparedScatterShapeData} from '~core/shapes/scatter/types';

import {block} from '../../../utils';
import {HtmlLayer} from '../HtmlLayer';

export {prepareScatterData} from '~core/shapes/scatter/prepare-data';

const b = block('scatter');

type ScatterSeriesShapeProps = {
    htmlLayout: HTMLElement | null;
    preparedData: PreparedScatterShapeData;
    seriesOptions: PreparedSeriesOptions;
    clipPathId?: string;
    dispatcher?: Dispatch<object>;
};

export function ScatterSeriesShape(props: ScatterSeriesShapeProps) {
    const {clipPathId, dispatcher, preparedData, seriesOptions, htmlLayout} = props;
    const ref = React.useRef<SVGGElement>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderScatter({plot: ref.current}, preparedData, seriesOptions, dispatcher);
    }, [dispatcher, preparedData, seriesOptions]);

    const htmlLayerData = React.useMemo(() => {
        return {htmlElements: preparedData.htmlLabels};
    }, [preparedData]);

    return (
        <React.Fragment>
            <g
                ref={ref}
                className={b()}
                clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
            />
            <HtmlLayer preparedData={htmlLayerData} htmlLayout={htmlLayout} />
        </React.Fragment>
    );
}
