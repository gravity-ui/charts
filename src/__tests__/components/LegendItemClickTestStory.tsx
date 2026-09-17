import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData} from '../../types';

interface Props {
    html?: boolean;
    preventDefault?: boolean;
}

export const LegendItemClickTestStory = ({html = false, preventDefault = false}: Props) => {
    const [clickedItem, setClickedItem] = React.useState('');
    const data = React.useMemo<ChartData>(
        () => ({
            legend: {
                enabled: true,
                html,
                events: {
                    itemClick: (item, event) => {
                        const custom = item.custom as {key: string};
                        setClickedItem(`${item.name}:${item.visible}:${custom.key}`);

                        if (preventDefault) {
                            event.preventDefault();
                        }
                    },
                },
            },
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'First series',
                        custom: {key: 'first'},
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 2},
                        ],
                    },
                    {
                        type: 'line',
                        name: 'Second series',
                        custom: {key: 'second'},
                        data: [
                            {x: 0, y: 2},
                            {x: 1, y: 1},
                        ],
                    },
                ],
            },
        }),
        [html, preventDefault],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={data} />
            <output data-qa="clicked-legend-item">{clickedItem}</output>
        </React.Fragment>
    );
};
