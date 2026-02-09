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

if (typeof HTMLCanvasElement !== 'undefined') {
    // jsdom does not implement HTMLCanvasElement.prototype.getContext (used for text measurement)
    HTMLCanvasElement.prototype.getContext = (() => ({
        font: '',
        measureText: () => ({width: 0}),
    })) as never;
}
