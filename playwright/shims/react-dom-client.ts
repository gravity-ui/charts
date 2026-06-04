// React 17 compat shim for `react-dom/client` (createRoot / hydrateRoot).
// Used only when REACT_VERSION=17 — Playwright CT's registerSource imports
// from 'react-dom/client', which doesn't exist on React 17. Vite aliases
// that import to this file. Does not reproduce concurrent-root semantics.
//
// `as any` because React 18+ type definitions drop ReactDOM.render in favor
// of createRoot; this file must still type-check there.

import * as ReactDOM from 'react-dom';

type Container = Element | DocumentFragment;
type ReactNode = unknown;

class LegacyRoot {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    render(element: ReactNode): void {
        (ReactDOM as any).render(element, this.container);
    }

    unmount(): void {
        (ReactDOM as any).unmountComponentAtNode(this.container);
    }
}

export function createRoot(container: Container): LegacyRoot {
    return new LegacyRoot(container);
}

export function hydrateRoot(container: Container, element: ReactNode): LegacyRoot {
    (ReactDOM as any).hydrate(element, container);
    return new LegacyRoot(container);
}
