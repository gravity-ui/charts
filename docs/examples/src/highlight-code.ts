import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
import {editor} from 'monaco-editor/esm/vs/editor/editor.api.js';

export function highlightCode(code: string, isDark: boolean) {
    editor.setTheme(isDark ? 'vs-dark' : 'vs');
    return editor.colorize(code, 'typescript', {});
}
