// @ts-check

const fs = require('node:fs');
const path = require('node:path');

const lodash = require('lodash');
const yaml = require('yaml');

/** @typedef {import('./types').TypedocConfig} TypedocConfig */
/** @typedef {import('./types').Config} Config */
/** @typedef {import('./types').TocFile} TocFile */
/** @typedef {import('./types').TocItem} TocItem */
/** @typedef {import('./types').TocItemHref} TocItemHref */
/** @typedef {import('./types').ApiYamlConfig} ApiYamlConfig */

const FILE_CONFIG_NAME = 'docs-gen.json';
const TYPEDOC_CONFIG_NAME = 'typedoc.json';
const TMP_DIR = '.tmp';
const regexMdLinks = /\[([^[]+)\](\(.*\))/gm;
const singleMatch = /\[([^[]+)\]\((.*)\)/;

/**
 * Reads and parses TypeDoc configuration from typedoc.json file
 * @returns {TypedocConfig} Parsed TypeDoc configuration
 * @throws {Error} If typedoc.json file is invalid
 */
function getTypedocConfig() {
    const filePath = path.resolve(process.cwd(), `./${TYPEDOC_CONFIG_NAME}`);
    const file = fs.readFileSync(filePath, {encoding: 'utf8'});
    /** @type {TypedocConfig} */
    let config;

    try {
        config = JSON.parse(file);
    } catch (error) {
        throw new Error(`Invalid ${TYPEDOC_CONFIG_NAME} file`, {cause: error});
    }

    return config;
}

/**
 * Reads and parses configuration from docs-gen.json file.
 * If file is not found or invalid, returns default configuration.
 * @returns {Config} Configuration object
 */
function getConfig() {
    const typedocConfig = getTypedocConfig();
    const filePath = path.resolve(process.cwd(), `./${FILE_CONFIG_NAME}`);
    const file = fs.readFileSync(filePath, {encoding: 'utf8'});
    /** @type {Config} */
    let config;

    try {
        config = {
            ...JSON.parse(file),
            typedocConfig,
        };
    } catch {
        config = {
            pathToTocFile: './toc.yaml',
            pathToDocsFolder: './',
            typedocConfig: {
                out: typedocConfig.out,
                entryFileName: typedocConfig.entryFileName || 'overview.md',
                name: typedocConfig.name || 'API',
            },
        };
    }

    return config;
}

/**
 * Gets the index TOC file name
 * @param {string} [fileName=''] - Input file name
 * @returns {string} Index TOC file name
 */
function getIndexTocFileName(fileName = '') {
    const nameWithoutExtension = fileName.split('.')[0];
    return nameWithoutExtension.charAt(0).toUpperCase() + nameWithoutExtension.slice(1);
}

/**
 * Extracts markdown links from text and returns them as key-value pairs
 * @param {string} fileText - The text content to parse for markdown links
 * @param {string} projectName - The project name to exclude from results
 * @returns {Object.<string, string>} Object containing link text as keys and URLs as values, excluding links with text matching projectName
 */
function getFileLinks(fileText, projectName) {
    /** @type {Object.<string, string>} */
    const links = {};
    const matches = fileText.match(regexMdLinks);
    matches?.forEach((match) => {
        const text = singleMatch.exec(match);

        if (!text) {
            return;
        }

        const [, key, value] = text;

        if (key !== projectName) {
            links[key] = value;
        }
    });

    return links;
}

/**
 * Recursively traverses directories to build a map of index files and their links
 * @param {Object} options - Configuration options
 * @param {string} options.dirPath - Path to the directory to scan
 * @param {string} options.basePath - Base path for calculating relative paths
 * @param {string} options.entryFileName - Name of entry files to look for
 * @param {Object.<string, Object.<string, string>>} [options.indexFilesMap={}] - Accumulator for storing found index files
 * @param {string} options.projectName - Project name to exclude from link results
 * @returns {Object.<string, Object.<string, string>>} Map of relative file paths to their contained links
 */
function getIndexFilesMap({dirPath, basePath, entryFileName, indexFilesMap = {}, projectName}) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const filePath = path.join(dirPath, file);

        if (fs.statSync(filePath).isDirectory()) {
            getIndexFilesMap({
                dirPath: filePath,
                basePath,
                entryFileName,
                indexFilesMap,
                projectName,
            });
        } else {
            const relativePath = path.relative(basePath, filePath);
            if (file === entryFileName) {
                const fileText = fs.readFileSync(filePath, {encoding: 'utf8'});
                const fileLinks = getFileLinks(fileText, projectName);
                indexFilesMap[relativePath] = fileLinks;
            }
        }
    });

    return indexFilesMap;
}

/**
 * Reads and parses YAML table of contents file
 * @param {string} pathToTocFile - Path to the YAML table of contents file
 * @returns {TocFile} Parsed YAML content of the table of contents
 * @throws {Error} If file reading or parsing fails
 */
function getOriginalTocFile(pathToTocFile) {
    try {
        const filePath = path.resolve(process.cwd(), pathToTocFile);
        return yaml.parse(fs.readFileSync(filePath, {encoding: 'utf8'}));
    } catch (error) {
        throw new Error('Error reading toc file', {cause: error});
    }
}

/**
 * Finds and returns the TOC item marked for autogenerated-documentation along with its index
 * @param {TocFile} originalTocFile - The parsed YAML table of contents object
 * @returns {[TocItemHref, number]} A tuple containing [tocItem, index] where:
 *   - tocItem: The TOC item object that has the autodoc flag
 *   - index: The index position of the item in the original items array
 * @throws {Error} When no TOC item with autodoc flag is found
 */
function getAutogeneratedTocItem(originalTocFile) {
    const autogeneratedTocItemIndex = originalTocFile.items.findIndex((item) => item.autodoc);

    if (autogeneratedTocItemIndex === -1) {
        throw new Error(
            'No autogenerated TOC item found. Perhaps you forgot to add the "autodoc" flag to the TOC item?',
        );
    }

    const item = originalTocFile.items[autogeneratedTocItemIndex];

    if (!('href' in item)) {
        throw new Error('The autogenerated TOC item should have a "href" property.');
    }

    if (!item.href.startsWith('./')) {
        throw new Error('The autogenerated TOC item should start with "./"');
    }

    return [item, autogeneratedTocItemIndex];
}

/**
 * Sorts object keys alphabetically while keeping the index TOC item first
 * @template T
 * @param {T} obj - The object to sort
 * @param {string} indexTocItemName - The name of the index TOC item to keep first
 * @returns {T} A new object with sorted keys, maintaining index TOC item at the beginning
 */
function sortObjectKeysWithIndexFirst(obj, indexTocItemName) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const sorted = {};

    if (indexTocItemName in obj) {
        sorted[indexTocItemName] = obj[indexTocItemName];
    }

    Object.keys(obj)
        .filter((key) => key !== indexTocItemName)
        .sort()
        .forEach((key) => {
            sorted[key] = sortObjectKeysWithIndexFirst(obj[key], indexTocItemName);
        });

    // prettier-ignore
    return /** @type {T} */ (sorted);
}

/**
 * Converts a configuration object into a table of contents structure
 * @param {ApiYamlConfig} config - The configuration object to convert
 * @param {string} parentPath - The parent path for building nested paths
 * @returns {Array<TocItem>} Array of TOC items with nested structure
 */
function convertToTocItem(config, parentPath) {
    return Object.entries(config).map(([key, value]) => {
        if (typeof value === 'object') {
            return {
                name: key,
                items: convertToTocItem(value, `${parentPath}/${key}`),
            };
        }

        return {
            name: key,
            href: value,
        };
    });
}

/**
 * Creates a temporary copy of documentation files in a timestamped directory
 * @param {string} pathToDocsFolder - Path to the source documentation folder to be copied
 * @returns {string} Path to the newly created temporary documentation directory
 * @throws {Error} If directory creation or copy operation fails
 */
function createTmpDocs(pathToDocsFolder) {
    const tmpPath = path.resolve(process.cwd(), TMP_DIR);
    const timestamp = Date.now();
    const tmpDocsPath = path.join(tmpPath, `docs-${timestamp}`);

    if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath);
    }

    fs.cpSync(path.resolve(pathToDocsFolder), tmpDocsPath, {recursive: true});

    return tmpDocsPath;
}

/**
 * Generates a configuration object for the API YAML items
 * @param {Object} params - An object containing the necessary parameters for generating the API YAML configuration.
 * @param {Object} params.indexFilesMap - A map of file paths to their corresponding entry file names.
 * @param {string} params.indexTocItemName - The name of the TOC item that represents the index file.
 * @param {string} params.baseTocItemPath - The base path for the TOC item paths.
 * @param {string} params.entryFileName - The name of the entry file.
 * @returns {ApiYamlConfig} The generated API YAML configuration object.
 */
function getApiYamlConfig({indexFilesMap, indexTocItemName, baseTocItemPath, entryFileName}) {
    return Object.entries(indexFilesMap).reduce(
        /** @param {ApiYamlConfig} acc */
        (acc, [key, value]) => {
            let keyPath = key.split('/').filter(Boolean);

            if (keyPath.length > 1) {
                keyPath = keyPath.slice(0, -1);
            } else {
                acc[indexTocItemName] = `${baseTocItemPath}/${entryFileName}`;
                return acc;
            }

            Object.keys(value).forEach((vKey) => {
                value[vKey] = `${baseTocItemPath}/${keyPath.join('/')}/${value[vKey]}`;
            });

            if (Object.keys(value).length) {
                value[indexTocItemName] =
                    `${baseTocItemPath}/${keyPath.join('/')}/${entryFileName}`;
            }

            const updates = {};
            lodash.set(updates, keyPath, value);
            lodash.merge(acc, updates);

            return acc;
        },
        {},
    );
}

module.exports = {
    getConfig,
    getIndexTocFileName,
    getIndexFilesMap,
    getOriginalTocFile,
    getAutogeneratedTocItem,
    sortObjectKeysWithIndexFirst,
    convertToTocItem,
    createTmpDocs,
    getApiYamlConfig,
};
