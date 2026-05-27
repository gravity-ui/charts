import React from 'react';

import {block} from '../../../utils';

const b = block('tooltip');

type TooltipRowCellView = {
    formattedValue: string;
    align?: string;
    width?: string;
};

export function Row(props: {
    active?: boolean;
    className?: string;
    striped?: boolean;
    style?: React.CSSProperties;
    cells: (TooltipRowCellView | null)[];
}) {
    const {active, className, striped, style, cells} = props;

    return (
        <tr className={b('content-row', {active, striped}, className)} style={style}>
            {cells.map((cell, cellIndex) => {
                if (cell === null) {
                    return null;
                }

                const cellStyle = {
                    ...(cell.align ? {textAlign: cell.align} : {}),
                    ...(cell.width ? {width: cell.width} : {}),
                } as React.CSSProperties;

                return (
                    <td key={cellIndex} className={b('content-row-cell')} style={cellStyle}>
                        <span dangerouslySetInnerHTML={{__html: cell.formattedValue}} />
                    </td>
                );
            })}
        </tr>
    );
}
