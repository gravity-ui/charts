import React from 'react';

const startTransition = (
    React as typeof React & {
        startTransition?: (callback: () => void) => void;
    }
).startTransition;

export function runInTransition(callback: () => void) {
    if (typeof startTransition === 'function') {
        return startTransition(callback);
    } else {
        return callback();
    }
}
