import React from 'react';

import {select} from 'd3';
import type {DebouncedFunc} from 'lodash';
import debounce from 'lodash/debounce';

import {i18nFactory} from '../i18n';
import type {ChartData} from '../types';
import {getUniqId} from '../utils';
import {validateData} from '../validation';

import {Chart} from './Chart';

type GravityChartRef = {
    reflow: () => void;
};

type ChartDimentions = {
    height: number;
    width: number;
};

type GravityChartProps = {
    data: ChartData;
    lang?: string;
    onResize?: (args: {dimensions?: ChartDimentions}) => void;
};

export const GravityChart = React.forwardRef<GravityChartRef, GravityChartProps>(
    function GravityChart(props, forwardedRef) {
        const {data, lang, onResize} = props;
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
                const {width, height} = parentElement.getBoundingClientRect();
                setDimensions({width, height});
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
                    <Chart height={dimensions?.height} width={dimensions?.width} data={data} />
                )}
            </div>
        );
    },
);
