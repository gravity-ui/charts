import React from 'react';

import type {DebouncedFunc} from 'es-toolkit/compat';
import {debounce} from 'es-toolkit/compat';

import {i18nFactory} from '~core/i18n';
import {validateData} from '~core/validation';

import '../plugins';
import type {ChartApi, ChartData, ChartInteractionItem, MeaningfulAny} from '../types';

import {ChartInner} from './ChartInner';

export {ChartTooltipContent} from './Tooltip/ChartTooltipContent';
export type {ChartTooltipContentProps} from './Tooltip/ChartTooltipContent';

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

export interface ChartProps<TItem extends ChartInteractionItem = ChartInteractionItem> {
    data: ChartData<MeaningfulAny, TItem>;
    lang?: string;
    onResize?: ChartOnResize;
    onReady?: ChartOnResize;
}

interface ChartComponent extends React.ForwardRefExoticComponent<
    ChartProps & React.RefAttributes<ChartRef>
> {
    <TItem extends ChartInteractionItem>(
        props: ChartProps<TItem> & React.RefAttributes<ChartRef>,
    ): React.ReactNode;
}

export const Chart = React.forwardRef<ChartRef, ChartProps>(function Chart(props, forwardedRef) {
    const {data, lang, onResize, onReady} = props;
    const innerRef = React.useRef<ChartApi>(null);
    const validatedData = React.useRef<ChartData>();
    const ref = React.useRef<HTMLDivElement>(null);
    const debounced = React.useRef<
        DebouncedFunc<(options?: HandleResizeOptions) => void> | undefined
    >();
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

    const debuncedHandleResize = React.useMemo(() => {
        debounced.current?.cancel();
        debounced.current = debounce(handleResize, 200);
        return debounced.current;
    }, [handleResize]);

    const chartApi = React.useMemo<ChartApi>(
        () => ({
            getClosest: (position, options) =>
                innerRef.current?.getClosest(position, options) ?? null,
        }),
        [],
    );

    React.useImperativeHandle(
        forwardedRef,
        () => ({
            reflow(options?: ChartReflowOptions) {
                if (options?.immediate) {
                    handleResize({force: true});
                } else {
                    debuncedHandleResize({force: true});
                }
            },
        }),
        [debuncedHandleResize, handleResize],
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

        const observer = new ResizeObserver(() => debuncedHandleResize());
        observer.observe(parentElement);

        return () => {
            observer.disconnect();
            debuncedHandleResize.cancel();
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
            {Boolean(dimensions?.height && dimensions?.width) && (
                <ChartInner
                    ref={innerRef}
                    chartApi={chartApi}
                    height={dimensions?.height ?? 0}
                    width={dimensions?.width ?? 0}
                    data={data}
                    onReady={onReady}
                />
            )}
        </div>
    );
}) as ChartComponent;
