import React from 'react';

import {select} from 'd3';
import type {DebouncedFunc} from 'lodash';
import debounce from 'lodash/debounce';

import {i18nFactory} from '../i18n';
import type {ChartData} from '../types';
import {getUniqId} from '../utils';
import {validateData} from '../validation';

import {ChartInner} from './ChartInner';

export * from './Tooltip/ChartTooltipContent';

export interface ChartRef {
    reflow: () => void;
}

export interface ChartDimentions {
    height: number;
    width: number;
}

export type ChartOnResize = (args: {dimensions?: ChartDimentions}) => void;

export interface ChartProps {
    data: ChartData;
    lang?: string;
    onResize?: ChartOnResize;
    onReady?: ChartOnResize;
}

export const Chart = React.forwardRef<ChartRef, ChartProps>(function Chart(props, forwardedRef) {
    const {data, lang, onResize, onReady} = props;
    const validatedData = React.useRef<ChartData>();
    const ref = React.useRef<HTMLDivElement>(null);
    const debounced = React.useRef<DebouncedFunc<() => void> | undefined>();
    const [dimensions, setDimensions] = React.useState<ChartDimentions>();

    if (validatedData.current !== data) {
        validateData(data);
        validatedData.current = data;
    }

    const handleResize = React.useCallback(() => {
        const parentElement = ref.current?.parentElement;

        if (parentElement) {
            setDimensions({width: parentElement.clientWidth, height: parentElement.clientHeight});
        }
    }, []);

    const debuncedHandleResize = React.useMemo(() => {
        debounced.current?.cancel();
        debounced.current = debounce(handleResize, 200);
        return debounced.current;
    }, [handleResize]);

    React.useImperativeHandle(
        forwardedRef,
        () => ({
            reflow() {
                debuncedHandleResize();
            },
        }),
        [debuncedHandleResize],
    );

    React.useEffect(() => {
        // dimensions initialize
        debuncedHandleResize();
    }, [debuncedHandleResize]);

    React.useEffect(() => {
        const selection = select(window);
        // https://github.com/d3/d3-selection/blob/main/README.md#handling-events
        const eventName = `resize.${getUniqId()}`;
        selection.on(eventName, debuncedHandleResize);

        return () => {
            // https://d3js.org/d3-selection/events#selection_on
            selection.on(eventName, null);
        };
    }, [debuncedHandleResize]);

    React.useEffect(() => {
        if (typeof onResize === 'function') {
            onResize({dimensions});
        }
    }, [dimensions, onResize]);

    React.useEffect(() => {
        if (lang && i18nFactory.lang !== lang) {
            i18nFactory.setLang(lang);
        }
    }, [lang]);

    return (
        <div
            ref={ref}
            style={{
                width: dimensions?.width || '100%',
                height: dimensions?.height || '100%',
                position: 'relative',
            }}
        >
            {dimensions?.height && dimensions?.width && (
                <ChartInner
                    height={dimensions?.height}
                    width={dimensions?.width}
                    data={data}
                    onReady={onReady}
                />
            )}
        </div>
    );
});
