import React from 'react';

import {getSeriesPlugin} from '~core/series/seriesRegistry';

import type {ChartData} from '../../../types';
import {Chart} from '../../index';
import type {ChartRef} from '../../index';

const initialData: ChartData = {
    legend: {enabled: false},
    series: {
        data: [
            {
                type: 'line',
                name: 'Failure fixture',
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 2},
                ],
            },
        ],
    },
};

export function ReflowFailure({mode}: {mode: 'awaited' | 'ignored' | 'no-reflow'}) {
    const ref = React.useRef<ChartRef>(null);
    const host = React.useRef<HTMLDivElement>(null);
    const fail = React.useRef(false);
    const failure = React.useMemo(() => new Error('real asynchronous preparation failure'), []);
    const [data, setData] = React.useState(initialData);
    const [status, setStatus] = React.useState('mounting');
    const [reported, setReported] = React.useState('none');
    const onReady = React.useCallback(() => setStatus('ready'), []);

    React.useEffect(() => {
        const plugin = getSeriesPlugin('line');
        const original = plugin.prepareShapeData;
        plugin.prepareShapeData = async (args) => {
            await Promise.resolve();
            if (fail.current) throw failure;
            return original(args);
        };
        const onUnhandled = (event: PromiseRejectionEvent) => {
            setReported(event.reason === failure ? 'original' : 'wrong error');
        };
        window.addEventListener('unhandledrejection', onUnhandled);
        return () => {
            plugin.prepareShapeData = original;
            window.removeEventListener('unhandledrejection', onUnhandled);
        };
    }, [failure]);

    return (
        <div>
            <div ref={host} style={{width: 600, height: 400}}>
                <Chart ref={ref} data={data} onReady={onReady} />
            </div>
            <button
                onClick={() => {
                    fail.current = true;
                    if (mode === 'no-reflow') {
                        setData({...initialData});
                        return;
                    }
                    host.current!.style.height = '450px';
                    const completion = ref.current!.reflow({immediate: true});
                    if (mode === 'awaited') {
                        completion.catch((error: unknown) => {
                            setStatus(error === failure ? 'awaited original' : 'wrong error');
                        });
                    }
                }}
            >
                Fail preparation
            </button>
            <output aria-label="status">{status}</output>
            <output aria-label="unhandled">{reported}</output>
        </div>
    );
}
