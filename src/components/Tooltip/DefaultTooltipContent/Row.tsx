import React from 'react';

import {block} from '../../../utils';

const b = block('tooltip');

export function Row(props: {
    label: React.ReactNode;
    value: React.ReactNode;
    active?: boolean;
    className?: string;
    color?: string;
    striped?: boolean;
    style?: React.CSSProperties;
}) {
    const {label, value, active, color, className, striped, style} = props;

    return (
        <div className={b('content-row', {active, striped}, className)} style={style}>
            {color && <div className={b('content-row-color')} style={{backgroundColor: color}} />}
            {label}
            <span className={b('content-row-value')}>{value}</span>
        </div>
    );
}
