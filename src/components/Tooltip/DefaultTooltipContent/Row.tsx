import React from 'react';

import {block} from '../../../utils';

const b = block('tooltip');

export function Row(props: {
    label: React.ReactNode;
    active?: boolean;
    className?: string;
    color?: string;
    colorSymbol?: React.ReactNode;
    striped?: boolean;
    style?: React.CSSProperties;
    value?: React.ReactNode;
}) {
    const {label, value, active, color, colorSymbol, className, striped, style} = props;

    const colorItem = React.useMemo(() => {
        if (colorSymbol) {
            return colorSymbol;
        }

        if (color) {
            return <div className={b('content-row-color')} style={{backgroundColor: color}} />;
        }

        return null;
    }, [color, colorSymbol]);

    return (
        <tr className={b('content-row', {active, striped}, className)} style={style}>
            {colorItem && <td className={b('content-row-color-cell')}>{colorItem}</td>}
            <td className={b('content-row-label-cell')}>{label}</td>
            {value && <td className={b('content-row-value-cell')}>{value}</td>}
        </tr>
    );
}
