// @ts-check

import {MarkdownTheme, MarkdownThemeContext} from 'typedoc-plugin-markdown';

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
    app.renderer.defineTheme('custom-markdown-theme', MyMarkdownTheme);

    //     app.renderer.markdownHooks.on('content.begin', () => `> "content.begin" hook`);

    //     app.renderer.markdownHooks.on(
    //         'index.page.end',
    //         () => `***
    // content.page.end hook *@Copyright XYZ*
    // `,
    //     );
}

class MyMarkdownTheme extends MarkdownTheme {
    /**
     * @param {import('typedoc-plugin-markdown').MarkdownPageEvent} page
     */
    getRenderContext(page) {
        return new MyMarkdownThemeContext(this, page, this.application.options);
    }
}

class MyMarkdownThemeContext extends MarkdownThemeContext {
    constructor(theme, page, options) {
        super(theme, page, options);
        // const hey = this.partials.breadcrumbs.bind(this);
        // this.partials.breadcrumbs = () => {
        //     const result = hey();
        //     return result.replace('@gravity-ui/charts', 'API');
        // };
    }
}
