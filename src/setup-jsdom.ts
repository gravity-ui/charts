// Global mocks for jsdom environment.
// Guarded by typeof checks so this file is safe to run in the `node` environment too.

if (typeof document !== 'undefined') {
    // jsdom does not implement document.fonts
    if (!document.fonts) {
        Object.defineProperty(document, 'fonts', {
            value: {ready: Promise.resolve()},
            configurable: true,
        });
    }
}

if (typeof ResizeObserver === 'undefined') {
    const resizeObserverCallbacks = new Map<Element, Set<ResizeObserverCallback>>();

    global.ResizeObserver = class ResizeObserver {
        private callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
            this.callback = callback;
        }

        observe(target: Element) {
            if (!resizeObserverCallbacks.has(target)) {
                resizeObserverCallbacks.set(target, new Set());
            }
            resizeObserverCallbacks.get(target)!.add(this.callback);
        }

        unobserve(target: Element) {
            resizeObserverCallbacks.get(target)?.delete(this.callback);
        }

        disconnect() {
            resizeObserverCallbacks.forEach((callbacks) => {
                callbacks.delete(this.callback);
            });
        }
    };

    /**
     * Test helper: simulate a ResizeObserver notification for the given element.
     */
    (global as any).__triggerResizeObserver = (target: Element) => {
        const callbacks = resizeObserverCallbacks.get(target);
        if (callbacks) {
            const entry = [{target, contentRect: target.getBoundingClientRect()}] as any;
            callbacks.forEach((cb) => cb(entry, {} as any));
        }
    };
}

if (typeof HTMLCanvasElement !== 'undefined') {
    // jsdom does not implement HTMLCanvasElement.prototype.getContext (used for text measurement)
    HTMLCanvasElement.prototype.getContext = (() => ({
        font: '',
        measureText: () => ({width: 0}),
    })) as never;
}
