import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import type {ShapeConfig} from '~core/plugins/series/shared/types';
import type {PreparedSeriesOptions} from '~core/series/types';

import {HtmlLayer} from './HtmlLayer';

type Props = {
    config: ShapeConfig;
    preparedData: unknown;
    seriesOptions: PreparedSeriesOptions;
    boundsWidth: number;
    boundsHeight: number;
    clipPathId: string;
    htmlLayout: HTMLElement | null;
    dispatcher?: Dispatch<object>;
};

export const SeriesShape = ({
    config,
    preparedData,
    seriesOptions,
    boundsWidth,
    boundsHeight,
    clipPathId,
    htmlLayout,
    dispatcher,
}: Props) => {
    const nodesRef = React.useRef<Record<string, SVGGElement | null>>({});

    React.useEffect(() => {
        const nodes = nodesRef.current;
        if (config.refs.some(({key}) => !nodes[key])) {
            return () => {};
        }
        return config.render({
            nodes: nodes as Record<string, SVGGElement>,
            preparedData,
            seriesOptions,
            boundsWidth,
            boundsHeight,
            dispatcher,
        });
    }, [config, preparedData, seriesOptions, boundsWidth, boundsHeight, dispatcher]);

    const htmlElements = React.useMemo(
        () => config.getHtmlElements(preparedData),
        [config, preparedData],
    );

    return (
        <React.Fragment>
            {config.refs.map(({key, className, withClipPath}) => (
                <g
                    key={key}
                    ref={(el) => {
                        nodesRef.current[key] = el;
                    }}
                    className={className}
                    clipPath={withClipPath ? `url(#${clipPathId})` : undefined}
                />
            ))}
            <HtmlLayer htmlLayout={htmlLayout} preparedData={{htmlElements}} />
        </React.Fragment>
    );
};
