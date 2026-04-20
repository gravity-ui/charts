import React from 'react';

import {ChartStory} from '../../__stories__/ChartStory';
import type {ChartData} from '../../types';

type Props = {
    data: ChartData;
};

export const DrawerChartTestStory = ({data}: Props) => {
    const [open, setOpen] = React.useState(false);

    return (
        <div>
            <button onClick={() => setOpen(true)}>Open drawer</button>
            <div
                data-open={open}
                style={{
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 500,
                    transform: open ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 300ms ease',
                    background: 'white',
                    padding: 16,
                    boxSizing: 'border-box',
                }}
            >
                <div style={{height: 280}}>
                    <ChartStory data={data} />
                </div>
            </div>
        </div>
    );
};
