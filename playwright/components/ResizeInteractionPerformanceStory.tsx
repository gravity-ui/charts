import React from 'react';

import {Chart} from '../../src/components';
import type {ChartData} from '../../src/types';

const INTERACTION_INTERVAL = 50;
const MEASUREMENT_DURATION = 1600;
const SETTLE_DELAY = 400;

export type ResizeInteractionMetrics = {
    interactionCount: number;
    interactionP95: number;
    resizeCount: number;
    renderedResizeCount: number;
};

function getPercentile(values: number[], percentile: number) {
    const sortedValues = [...values].sort((a, b) => a - b);
    const index = Math.floor((sortedValues.length - 1) * percentile);

    return sortedValues[index] ?? 0;
}

export function ResizeInteractionPerformanceStory({data}: {data: ChartData}) {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const interactionLatencies = React.useRef<number[]>([]);
    const interactionScheduledAt = React.useRef<number>();
    const resizeCount = React.useRef(0);
    const [interactionCount, setInteractionCount] = React.useState(0);
    const [metrics, setMetrics] = React.useState<ResizeInteractionMetrics>();

    React.useLayoutEffect(() => {
        if (interactionScheduledAt.current !== undefined) {
            interactionLatencies.current.push(performance.now() - interactionScheduledAt.current);
            interactionScheduledAt.current = undefined;
        }
    }, [interactionCount]);

    const handleResize = React.useCallback(() => {
        resizeCount.current++;
    }, []);

    const handleInteraction = React.useCallback(() => {
        setInteractionCount((currentCount) => currentCount + 1);
    }, []);

    const handleStart = React.useCallback(() => {
        interactionLatencies.current = [];
        resizeCount.current = 0;
        setInteractionCount(0);
        setMetrics(undefined);

        let renderedResizeCount = 0;
        const seriesElement = containerRef.current?.querySelector('.gcharts-line');
        let previousPath = seriesElement?.querySelector('path')?.getAttribute('d');
        const observer = new MutationObserver(() => {
            const path = seriesElement?.querySelector('path')?.getAttribute('d');
            if (path && path !== previousPath) {
                renderedResizeCount++;
                previousPath = path;
            }
        });
        if (seriesElement) {
            observer.observe(seriesElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['d'],
            });
        }

        let stopped = false;
        let interactionTimer = 0;
        const scheduleInteraction = () => {
            const scheduledAt = performance.now() + INTERACTION_INTERVAL;
            interactionTimer = window.setTimeout(() => {
                interactionScheduledAt.current = scheduledAt;
                buttonRef.current?.click();
                if (!stopped) {
                    scheduleInteraction();
                }
            }, INTERACTION_INTERVAL);
        };

        const startedAt = performance.now();
        const resize = (timestamp: number) => {
            const elapsed = timestamp - startedAt;
            const progress = Math.min(elapsed / MEASUREMENT_DURATION, 1);

            if (containerRef.current) {
                containerRef.current.style.width = `${600 + Math.sin(progress * Math.PI * 8) * 200}px`;
            }

            if (elapsed < MEASUREMENT_DURATION) {
                requestAnimationFrame(resize);
            } else {
                stopped = true;
                observer.disconnect();
                window.clearTimeout(interactionTimer);
                window.setTimeout(() => {
                    setMetrics({
                        interactionCount: interactionLatencies.current.length,
                        interactionP95: getPercentile(interactionLatencies.current, 0.95),
                        resizeCount: resizeCount.current,
                        renderedResizeCount,
                    });
                }, SETTLE_DELAY);
            }
        };

        scheduleInteraction();
        requestAnimationFrame(resize);
    }, []);

    return (
        <React.Fragment>
            <button data-qa="start-measurement" onClick={handleStart}>
                Start
            </button>
            <button ref={buttonRef} data-qa="interaction" onClick={handleInteraction}>
                {interactionCount}
            </button>
            <output data-qa="metrics">{metrics && JSON.stringify(metrics)}</output>
            <div ref={containerRef} style={{height: 600, width: 800}}>
                <Chart data={data} onResize={handleResize} />
            </div>
        </React.Fragment>
    );
}
