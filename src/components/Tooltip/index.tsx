import React from 'react';

import {Popup} from '@gravity-ui/uikit';
import type {PopupProps} from '@gravity-ui/uikit';
import type {Dispatch} from 'd3-dispatch';

import type {PreparedSeries} from '~core/series/types';
import {getSvgScreenPoint} from '~core/utils/svg-screen-point';

import type {PreparedTooltip, PreparedXAxis, PreparedYAxis} from '../../hooks';
import {useTooltip} from '../../hooks';
import type {ChartTooltip, TooltipDataChunk} from '../../types';
import {block} from '../../utils';

import {TooltipContent} from './ChartTooltipContent';

import './styles.scss';

const b = block('tooltip');

interface TooltipProps {
    dispatcher: Dispatch<object>;
    tooltip: PreparedTooltip;
    seriesData: PreparedSeries[] | undefined;
    getHeaderFormat?: (hovered: TooltipDataChunk[]) => ChartTooltip['headerFormat'];
    svgContainer: SVGSVGElement | null;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    tooltipPinned: boolean;
    onOutsideClick?: () => void;
}

export const Tooltip = (props: TooltipProps) => {
    const {
        tooltip,
        seriesData,
        getHeaderFormat,
        xAxis,
        yAxis,
        svgContainer,
        dispatcher,
        tooltipPinned,
        onOutsideClick,
    } = props;
    const {
        hovered,
        hoveredValues,
        hoveredPlotBands,
        hoveredPlotLines,
        hoveredPlotShapes,
        pointerPosition,
    } = useTooltip({
        dispatcher,
        tooltip,
        seriesData,
        xAxis,
        yAxis,
    });
    const headerFormat = tooltip.headerFormat ?? getHeaderFormat?.(hovered ?? []);
    const pointerX = pointerPosition?.[0] ?? 0;
    const pointerY = pointerPosition?.[1] ?? 0;
    const anchor = React.useMemo(
        () => ({
            contextElement: svgContainer ?? undefined,
            getBoundingClientRect() {
                // Popup measures after commit; hover rendering must not force SVG layout.
                const {x: left, y: top} = getSvgScreenPoint(svgContainer, pointerX, pointerY);
                return {x: left, y: top, left, top, right: left, bottom: top, width: 0, height: 0};
            },
        }),
        [svgContainer, pointerX, pointerY],
    );

    const handleOnOpenChange: PopupProps['onOpenChange'] = (_open: boolean, e) => {
        if (svgContainer?.contains(e?.target as HTMLElement)) {
            return;
        }

        onOutsideClick?.();
    };

    return hovered?.length ? (
        <Popup
            anchorElement={anchor}
            className={b({pinned: tooltipPinned})}
            zIndex={tooltip.zIndex}
            disableTransition={true}
            floatingStyles={tooltipPinned ? undefined : {pointerEvents: 'none'}}
            offset={{mainAxis: 20}}
            onOpenChange={tooltipPinned ? handleOnOpenChange : undefined}
            open={true}
            placement={['right', 'left', 'top', 'bottom']}
        >
            <div className={b('popup-content')}>
                <TooltipContent
                    hovered={hovered}
                    hoveredValues={hoveredValues}
                    yAxes={yAxis}
                    hoveredPlotBands={hoveredPlotBands}
                    hoveredPlotLines={hoveredPlotLines}
                    hoveredPlotShapes={hoveredPlotShapes}
                    pinned={tooltipPinned}
                    renderer={tooltip.renderer}
                    rows={tooltip.rows}
                    rowRenderer={tooltip.rowRenderer}
                    totals={tooltip.totals}
                    valueFormat={tooltip.valueFormat}
                    headerFormat={headerFormat}
                    xAxis={xAxis}
                    qa={tooltip.qa}
                />
            </div>
        </Popup>
    ) : null;
};
