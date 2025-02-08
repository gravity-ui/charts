/**
 * @typedef {Object} TypedocConfig
 * @property {string[]} [exclude] - Array of file patterns to exclude
 * @property {boolean} [excludeExternals] - Exclude external symbols
 * @property {boolean} [excludePrivate] - Exclude private members from documentation
 * @property {boolean} [excludeProtected] - Exclude protected members from documentation
 * @property {string} entryFileName - Entry point file name
 * @property {string} [entryPoints] - Entry points for documentation generation
 * @property {string[]} [externalPattern] - Array of patterns for files that should be considered external
 * @property {boolean} [hideGenerator] - Do not print TypeDoc link at the end of the page
 * @property {boolean} [includeVersion] - Add package version to project name
 * @property {string} [name] - Project name
 * @property {string} out - Output directory for the documentation
 * @property {string} [readme] - Path to readme file
 * @property {('modules'|'library')} [theme] - Documentation theme to use
 * @property {string} [tsconfig] - Path to tsconfig.json
 */

/**
 * @typedef {Object} Config
 * @property {string} pathToTocFile - Path to table of contents YAML file
 * @property {string} pathToDocsFolder - Path to documentation folder
 * @property {Object} typedocConfig - TypeDoc specific options
 * @property {string} typedocConfig.out - Output directory for documentation
 * @property {string} typedocConfig.entryFileName - Entry file name for documentation
 * @property {string} typedocConfig.name - Project name
 */

/**
 * @typedef {Object} TocFile
 * @property {Array<TocItem>} items - Array of TOC items
 * @property {*} [key: string] - Any other properties
 */

/**
 * @typedef {Object} TocItemBase
 * @property {string} name - Display name of the item
 * @property {boolean} [autodoc] - Flag indicating if item is auto-documented
 */

/**
 * @typedef {TocItemBase & {href: string}} TocItemHref
 */

/**
 * @typedef {TocItemBase & {items: Array<TocItem>}} TocItemContainer
 */

/**
 * @typedef {TocItemHref | TocItemContainer} TocItem
 */

/**
 * @typedef {Object.<string, ConfigValue>} ApiYamlConfig
 *
 * @typedef {string|{[key: string]: ConfigValue}} ConfigValue
 */

module.exports = {};
