import React from 'react';

import type {DebouncedFunc} from 'lodash';
import debounce from 'lodash/debounce';

import {i18nFactory} from '~core/i18n';
import {validateData} from '~core/validation';

import '../plugins';
import type {ChartApi, ChartData, ChartInteractionItem, MeaningfulAny} from '../types';

import {ChartInner} from './ChartInner';
import type {ChartInnerRef, ChartPreparation} from './ChartInner/types';

export {ChartTooltipContent} from './Tooltip/ChartTooltipContent';
export type {ChartTooltipContentProps} from './Tooltip/ChartTooltipContent';

export interface ChartReflowOptions {
    immediate?: boolean;
}

export interface ChartRef {
    /**
     * Completes after the resized chart's shapes, axes, legend and range slider have committed.
     * Rejects on preparation failure, an unavailable host, or unmount.
     * Lifecycle cancellation is handled for fire-and-forget callers; preparation errors remain observable.
     */
    reflow: (options?: ChartReflowOptions) => Promise<void>;
}

export interface ChartDimentions {
    height: number;
    width: number;
}

interface HandleResizeOptions {
    force?: boolean;
}

interface PendingReflow {
    id: number;
    resolve: () => void;
    reject: (error: unknown) => void;
    promise: Promise<void>;
}

interface ChartLayout {
    dimensions: ChartDimentions;
    reflowId: number;
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
    const innerRef = React.useRef<ChartInnerRef>(null);
    const validatedData = React.useRef<ChartData>();
    const ref = React.useRef<HTMLDivElement>(null);
    const debounced = React.useRef<
        DebouncedFunc<(options?: HandleResizeOptions) => void> | undefined
    >();
    const [layout, setLayout] = React.useState<ChartLayout>();
    const dimensions = layout?.dimensions;
    const reflowId = layout?.reflowId ?? 0;
    const requestedReflowId = React.useRef(0);
    const pendingReflows = React.useRef<PendingReflow[]>([]);
    const failedReflowGenerations = React.useRef(new WeakSet<object>());
    const mounted = React.useRef(true);
    const currentData = React.useRef(data);
    currentData.current = data;

    const settleReflows = React.useCallback(
        (id: number, failure?: {error: unknown; cancelled?: boolean}) => {
            const settled = pendingReflows.current.filter((request) => request.id <= id);
            pendingReflows.current = pendingReflows.current.filter((request) => request.id > id);
            settled.forEach((request) => {
                if (failure) {
                    if (failure.cancelled) request.promise.catch(() => undefined);
                    request.reject(failure.error);
                } else {
                    request.resolve();
                }
            });
            return settled.length > 0;
        },
        [],
    );

    if (validatedData.current !== data) {
        validateData(data);
        validatedData.current = data;
    }

    const handleResize = React.useCallback(
        (options?: HandleResizeOptions) => {
            const parentElement = ref.current?.parentElement;
            const id = requestedReflowId.current;
            if (!parentElement) {
                settleReflows(id, {error: new Error('Chart host is unavailable'), cancelled: true});
                return;
            }

            const nextDimensions = {
                width: parentElement.clientWidth,
                height: parentElement.clientHeight,
            };
            const ready = innerRef.current?.isReady(nextDimensions, currentData.current);
            const force = options?.force || pendingReflows.current.length > 0;
            setLayout((current) => {
                if (
                    !force &&
                    current?.dimensions.width === nextDimensions.width &&
                    current.dimensions.height === nextDimensions.height
                ) {
                    return current;
                }
                return {
                    dimensions: nextDimensions,
                    reflowId: innerRef.current?.hasFailed() ? id : (current?.reflowId ?? 0),
                };
            });

            if (!nextDimensions.width || !nextDimensions.height) {
                settleReflows(id, {error: new Error('Chart host has zero size'), cancelled: true});
            } else if (ready) {
                settleReflows(id);
            }
        },
        [settleReflows],
    );

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
                let resolve!: () => void;
                let reject!: (error: unknown) => void;
                const promise = new Promise<void>((success, failure) => {
                    resolve = success;
                    reject = failure;
                });
                pendingReflows.current.push({
                    id: ++requestedReflowId.current,
                    resolve,
                    reject,
                    promise,
                });
                if (!mounted.current) {
                    settleReflows(requestedReflowId.current, {
                        error: new Error('Chart is unmounted'),
                        cancelled: true,
                    });
                } else if (options?.immediate) {
                    debuncedHandleResize.cancel();
                    handleResize({force: true});
                } else {
                    debuncedHandleResize({force: true});
                }
                return promise;
            },
        }),
        [debuncedHandleResize, handleResize, settleReflows],
    );

    const handleCommitted = React.useCallback<NonNullable<ChartProps['onReady']>>(
        (args) => {
            const host = ref.current?.parentElement;
            const rendered = args.dimensions;
            const isCurrent = () =>
                mounted.current &&
                host &&
                rendered &&
                host.clientWidth === rendered.width &&
                host.clientHeight === rendered.height &&
                innerRef.current?.isReady(rendered, currentData.current);
            if (isCurrent()) {
                settleReflows(Infinity);
                return;
            }
            if (pendingReflows.current.length) {
                handleResize({force: true});
            }
        },
        [settleReflows, handleResize],
    );
    const handleRenderError = React.useCallback(
        (error: unknown, generation: ChartPreparation) => {
            const host = ref.current?.parentElement;
            if (
                pendingReflows.current.length &&
                (generation.data !== currentData.current ||
                    host?.clientWidth !== generation.width ||
                    host?.clientHeight !== generation.height)
            ) {
                handleResize({force: true});
                return;
            }
            if (settleReflows(Infinity, {error})) {
                failedReflowGenerations.current.add(generation);
            } else if (!failedReflowGenerations.current.has(generation)) {
                throw error;
            }
        },
        [settleReflows, handleResize],
    );

    React.useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            settleReflows(Infinity, {
                error: new Error('Chart unmounted before reflow completed'),
                cancelled: true,
            });
        };
    }, [settleReflows]);

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
                    onCommitted={handleCommitted}
                    reflowId={reflowId}
                    onRenderError={handleRenderError}
                />
            )}
        </div>
    );
}) as ChartComponent;
