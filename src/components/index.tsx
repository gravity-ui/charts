import React from 'react';

import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

import {i18nFactory} from '~core/i18n';
import {runInTransition} from '~core/utils';
import {validateData} from '~core/validation';

import '../plugins';
import type {ChartData} from '../types';

import {ChartInner} from './ChartInner';

const RESIZE_UPDATE_INTERVAL = 200;

export * from './Tooltip/ChartTooltipContent';

export interface ChartReflowOptions {
    immediate?: boolean;
}

export interface ChartRef {
    reflow: (options?: ChartReflowOptions) => void;
}

export interface ChartDimentions {
    height: number;
    width: number;
}

interface HandleResizeOptions {
    force?: boolean;
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
    const [dimensions, setDimensions] = React.useState<ChartDimentions>();

    if (validatedData.current !== data) {
        validateData(data);
        validatedData.current = data;
    }

    const handleResize = React.useCallback((options?: HandleResizeOptions) => {
        const parentElement = ref.current?.parentElement;

        if (parentElement) {
            const nextDimensions = {
                width: parentElement.clientWidth,
                height: parentElement.clientHeight,
            };

            setDimensions((currentDimensions) => {
                if (
                    !options?.force &&
                    currentDimensions?.width === nextDimensions.width &&
                    currentDimensions.height === nextDimensions.height
                ) {
                    return currentDimensions;
                }

                return nextDimensions;
            });
        }
    }, []);

    const debouncedHandleResize = React.useMemo(
        () => debounce(handleResize, RESIZE_UPDATE_INTERVAL),
        [handleResize],
    );

    const throttledHandleResize = React.useMemo(() => {
        return throttle(
            (options?: HandleResizeOptions) => {
                runInTransition(() => handleResize(options));
            },
            RESIZE_UPDATE_INTERVAL,
            {leading: false},
        );
    }, [handleResize]);

    React.useImperativeHandle(
        forwardedRef,
        () => ({
            reflow(options?: ChartReflowOptions) {
                if (options?.immediate) {
                    handleResize({force: true});
                } else {
                    debouncedHandleResize({force: true});
                }
            },
        }),
        [debouncedHandleResize, handleResize],
    );

    React.useEffect(() => {
        // dimensions initialize
        handleResize();
    }, [handleResize]);

    React.useEffect(() => {
        const parentElement = ref.current?.parentElement;

        if (!parentElement) {
            return undefined;
        }

        const observer = new ResizeObserver(() => throttledHandleResize());
        observer.observe(parentElement);

        return () => {
            observer.disconnect();
            throttledHandleResize.cancel();
        };
    }, [throttledHandleResize]);

    React.useEffect(() => {
        return () => debouncedHandleResize.cancel();
    }, [debouncedHandleResize]);

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
            {Boolean(dimensions?.height && dimensions?.width) && (
                <ChartInner
                    height={dimensions?.height ?? 0}
                    width={dimensions?.width ?? 0}
                    data={data}
                    onReady={onReady}
                />
            )}
        </div>
    );
});
