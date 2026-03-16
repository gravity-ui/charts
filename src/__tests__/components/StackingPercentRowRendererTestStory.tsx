import React from 'react';

import {ChartStory} from '../../__stories__/ChartStory';
import {formatNumber} from '../../libs/format-number';
import type {BarXSeriesData, BarYSeriesData, ChartData, ChartTooltip} from '../../types';

type Props = {
    data: ChartData;
    rendererType: 'flex-jsx' | 'flex-html';
};

const getStackedPercentRowRenderer = ({
    valueKey,
}: {
    valueKey: 'x' | 'y';
}): ChartTooltip['rowRenderer'] => {
    return function barXYWithPercentRowRenderer({
        name,
        value,
        formattedValue,
        hovered,
        className,
        color,
    }) {
        const total =
            hovered?.reduce(
                (acc, item) =>
                    acc + Number((item.data as BarXSeriesData | BarYSeriesData)[valueKey] ?? 0),
                0,
            ) ?? 0;
        const numericValue = Number(value);
        const ratio = total === 0 ? 0 : numericValue / total;
        const percentage = Number.isFinite(numericValue)
            ? formatNumber(ratio, {format: 'percent', precision: 1})
            : '';
        const blockStyle = {
            display: 'flex',
            padding: '0 4px',
            maxWidth: '400px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        } as const;

        return (
            <div className={className} style={{display: 'flex'}}>
                <div style={blockStyle}>
                    <span
                        style={{
                            backgroundColor: color,
                            alignSelf: 'center',
                            borderRadius: '1px',
                            display: 'inline-block',
                            height: '6px',
                            width: '12px',
                        }}
                    />
                </div>
                <div style={blockStyle} dangerouslySetInnerHTML={{__html: name}} />
                <div style={{...blockStyle, marginLeft: 'auto'}}>
                    <span style={{marginRight: 12}}>{percentage}</span>
                    {formattedValue}
                </div>
            </div>
        );
    };
};

const getStackedPercentRowRendererHtml = ({
    valueKey,
}: {
    valueKey: 'x' | 'y';
}): ChartTooltip['rowRenderer'] => {
    return function barXYWithPercentRowRendererHtml({
        name,
        value,
        formattedValue,
        hovered,
        className,
        color,
    }) {
        const total =
            hovered?.reduce(
                (acc, item) =>
                    acc + Number((item.data as BarXSeriesData | BarYSeriesData)[valueKey] ?? 0),
                0,
            ) ?? 0;
        const numericValue = Number(value);
        const ratio = total === 0 ? 0 : numericValue / total;
        const percentage = Number.isFinite(numericValue)
            ? formatNumber(ratio, {format: 'percent', precision: 1})
            : '';

        const blockStyle =
            'display:flex;padding:0 4px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';

        return `<div class="${className ?? ''}" style="display:flex">
            <div style="${blockStyle}">
                <span style="background-color:${color};align-self:center;border-radius:1px;display:inline-block;height:6px;width:12px"></span>
            </div>
            <div style="${blockStyle}">${name}</div>
            <div style="${blockStyle};margin-left:auto">
                <span style="margin-right:12px">${percentage}</span>
                ${formattedValue}
            </div>
        </div>`;
    };
};

const renderers = {
    'flex-jsx': getStackedPercentRowRenderer({valueKey: 'y'}),
    'flex-html': getStackedPercentRowRendererHtml({valueKey: 'y'}),
};

export const StackingPercentRowRendererTestStory = ({data, rendererType}: Props) => {
    const chartData: ChartData = {
        ...data,
        tooltip: {rowRenderer: renderers[rendererType]},
    };

    return (
        <div style={{height: 400, width: 800, display: 'inline-block'}}>
            <ChartStory data={chartData} style={{height: 400, width: 800}} />
        </div>
    );
};
