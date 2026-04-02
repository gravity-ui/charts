import React from 'react';

import {createRoot} from 'react-dom/client';
import type {Root} from 'react-dom/client';

import {ChartPlayground} from './ChartPlayground';
import {registry} from './charts/registry';

import '@gravity-ui/uikit/styles/fonts.scss';
import '@gravity-ui/uikit/styles/styles.scss';

const MOUNTED_ATTR = 'data-chart-mounted';

// Track roots so we can unmount them when Diplodoc removes their elements
// (e.g. on theme switch), avoiding React root leaks.
const mountedRoots = new Map<HTMLElement, Root>();

function mountExamples() {
    document.querySelectorAll<HTMLElement>('[data-chart-example]').forEach((el) => {
        if (el.getAttribute(MOUNTED_ATTR)) return;
        el.setAttribute(MOUNTED_ATTR, 'true');

        const id = el.getAttribute('data-chart-example') ?? '';
        const mod = registry[id];
        if (!mod) {
            console.warn(`[chart-examples] Unknown example: "${id}"`);
            return;
        }
        const root = createRoot(el);
        mountedRoots.set(el, root);
        root.render(<ChartPlayground code={mod.code} Component={mod.Component} />);
    });
}

function unmountRemovedRoots(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
        mutation.removedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            // Unmount the node itself if it was a playground container
            const ownRoot = mountedRoots.get(node);
            if (ownRoot) {
                ownRoot.unmount();
                mountedRoots.delete(node);
            }
            // Unmount any descendant playground containers
            node.querySelectorAll<HTMLElement>(`[${MOUNTED_ATTR}]`).forEach((child) => {
                const childRoot = mountedRoots.get(child);
                if (childRoot) {
                    childRoot.unmount();
                    mountedRoots.delete(child);
                }
            });
        });
    }
}

// Debounce re-mount calls from MutationObserver to avoid excessive querySelectorAll
// on rapid DOM changes (e.g. during future live-editing re-renders).
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMountExamples() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        mountExamples();
    }, 50);
}

// Re-mount when Diplodoc replaces DOM nodes (e.g. on theme switch)
new MutationObserver((mutations) => {
    unmountRemovedRoots(mutations);
    scheduleMountExamples();
}).observe(document.body, {
    childList: true,
    subtree: true,
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountExamples);
} else {
    mountExamples();
}
