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
        <div className={b('content-row', {active, striped}, className)} style={style}>
            {colorItem}
            {label}
            {value && <span className={b('content-row-value')}>{value}</span>}
        </div>
    );
}
