export interface ThrottledFunction<T extends (...args: never[]) => void> {
    (...args: Parameters<T>): void;
    /** Drops the pending call, so that the next call runs at once. */
    cancel(): void;
}

/**
 * Calls `fn` at once, then at most once per `wait` milliseconds with the latest arguments, at the
 * end of each interval. es-toolkit's throttle waits `wait` after the last call instead, which
 * slows down updates during continuous pointer moves.
 */
export function throttle<T extends (...args: never[]) => void>(
    fn: T,
    wait: number,
): ThrottledFunction<T> {
    let lastRun = -Infinity;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingArgs: Parameters<T> | undefined;

    const run = (args: Parameters<T>) => {
        lastRun = Date.now();
        fn(...args);
    };

    const throttled = (...args: Parameters<T>) => {
        const remaining = lastRun + wait - Date.now();
        if (remaining <= 0 && timer === undefined) {
            run(args);
            return;
        }

        pendingArgs = args;
        if (timer === undefined) {
            timer = setTimeout(() => {
                timer = undefined;
                if (pendingArgs) {
                    const latestArgs = pendingArgs;
                    pendingArgs = undefined;
                    run(latestArgs);
                }
            }, remaining);
        }
    };

    throttled.cancel = () => {
        clearTimeout(timer);
        timer = undefined;
        pendingArgs = undefined;
        lastRun = -Infinity;
    };

    return throttled;
}
