module.exports = [
    {
        name: 'Chart',
        path: 'dist/esm/index.js',
        import: '{ Chart }',
        // Peer dependencies are paid for by the app. dayjs locales load lazily through
        // dynamic imports in @gravity-ui/date-utils, so an app fetches only the active one.
        ignore: ['react', 'react-dom', '@gravity-ui/uikit', 'dayjs/locale/*'],
        // A safety net against accidental blowups, not a budget: pull requests get a size
        // report, and growth is reviewed there.
        limit: '500 kB',
    },
];
