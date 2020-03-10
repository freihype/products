/*
define([
    "require",
    "dojo/Deferred",
    "dojo/promise/all",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "../library",
    "../model/Path",
    "../repositoryinfo",
    'xide/types'
], (require, Deferred, all, lang, connect, Library, Path, info, types) => {
*/
import { Path } from './';
import { mixin } from '@xblox/core/objects';
import { Library } from './library';
import { RESOURCE_VARIABLES } from '../../config';
let smartInputCache = {};
import * as Axios from 'axios';  // import axios types
import { default as axios } from 'axios';  // import axios public API
import { DeliteHelper } from './DeliteHelper';
/*import { DeliteHelper } from './DeliteHelper';*/
import { every } from '../utils';
const _d = new DeliteHelper();
/*
connect.subscribe('/davinci/ui/libraryChanged/start', () => {
    // XXX We should be smart about this and only reload data for libraries whose path has
    //  changed.  This code currently nukes everything, reloading all libs, even those that
    //  haven't changed.
    smartInputCache = {};
});
*/
const debug = false;
let Workbench;
let ctx;

// Array of library descriptors.
let libraries = {};

// Widget metadata cache
// XXX Should there be a limit on metadata objects in memory?
let mdCache = {};

// Cache for instantiated helper objects.  See getHelper().
let helperCache = {
    'delite/Button:helper': DeliteHelper
};

// Localization strings
let l10n = null;

// Each callbacks.js file gets its own deferred.
// Ensures page editors don't start processing until all callback.js files are ready
const deferredGets = [];

const libExtends = {};
// const dojo: any = {};

const defaultProperties = {
    id: {
        datatype: 'string',
        hidden: true
    },
    lang: {
        datatype: 'string',
        hidden: true
    },
    dir: {
        datatype: 'string',
        hidden: true
    },
    class: {
        datatype: 'string',
        hidden: true
    },
    style: {
        datatype: 'string',
        hidden: true
    },
    title: {
        datatype: 'string',
        hidden: true
    }
};

/*
dojo.subscribe('/davinci/ui/libraryChanged/start', () => {
    // XXX We should be smart about this and only reload data for libraries whose path has
    //  changed.  This code currently nukes everything, reloading all libs, even those that
    //  haven't changed.
    libraries = {};
    mdCache = {};
    helperCache = {};
    l10n = null;
    Metadata.init().then(() => {
        dojo.publish('/davinci/ui/libraryChanged');
    });
});
*/
/**
 * Copies/adds all properties of one or more sources to dest; returns dest.
 * Similar to dojo.mixin(), except this function does a deep merge.
 *
 * @param  {Object} dest
 *          The object to which to copy/add all properties contained in source. If dest is
 *          falsy, then a new object is manufactured before copying/adding properties
 *          begins.
 * @param  {Object} srcs
 *          One of more objects from which to draw all properties to copy into dest. Srcs
 *          are processed left-to-right and if more than one of these objects contain the
 *          same property name, the right-most value "wins".
 * @return {Object}
 *          dest, as modified
 */
function deepMixin(dest: object, srcs: object): object {
    dest = dest || {};
    for (let i = 1, l = arguments.length; i < l; i++) {
        const src = arguments[i];
        let name;
        let val;
        for (name in src) {
            if (src.hasOwnProperty(name)) {
                val = src[name];
                if (!(name in dest) || (typeof val !== 'object' && dest[name] !== val)) {
                    dest[name] = val;
                } else {
                    deepMixin(dest[name], val);
                }
            }
        }
    }
    return dest;
}

function parsePackage(pkg, path, root) {
    debug && console.log('parse pkg', pkg);
    libraries[pkg.name] = pkg;
    path = new Path(path);
    // merge in the 'oam' and 'maqetta' overlays
    const overlays = pkg.overlays;
    for (const name in overlays) {
        if (overlays.hasOwnProperty(name)) {
            if (name === 'oam' || name === 'maqetta') {
                deepMixin(pkg, overlays[name]);
            }
        }
    }
    delete pkg.overlays;

    // Register a module identifier for the metadata and library code paths;
    // used by helper and creation tool classes.
    pkg.__metadataModuleId = 'maq-metadata-' + pkg.name;
    const locPath = new Path(location.href);
    //remove filename from url
    // locPath.path = locPath.path.substring(0, locPath.path.lastIndexOf("/"));
    locPath.path = '' + root;

    const packages = [{
        name: pkg.__metadataModuleId,
        location: root + '/' + path
    }];

    if (pkg.name !== 'dojo' && pkg.name !== 'xide' && pkg.name !== 'xblox') {
        // Don't register another "dojo" lib to compete with core.client. Also, note
        // no longer adding pkg.version to module id because not compatible when
        // we go to custom build the library.
        pkg.__libraryModuleId = pkg.name;
        const libPath = 'app/static/lib/' + pkg.name + '/' + pkg.version;
        const _pkg = {
            name: pkg.__libraryModuleId,
            location: locPath.append(libPath).toString()
        };
    }
    // read in Maqetta-specific "scripts"
    let deferred; // dojo/Deferred or value
    //if (lang.exists('scripts.widget_metadata', pkg)) {
    if (typeof pkg.scripts.widget_metadata === 'string') {
        const widgetsJsonPath = path.append(pkg.scripts.widget_metadata);

        const widgetsUrl = root + '/' + widgetsJsonPath.toString();
        //console.log('load widgets from '  + widgetsUrl);
        deferred = axios.get(widgetsUrl, {

        }).then((body) => {
            if (body.data) {
                try {
                    if (typeof body.data === 'string') {
                        body.data = JSON.parse(body.data);
                    }
                } catch (e) {
                    console.error('error parsing pkg data ' + widgetsUrl, e);
                    body.data = {};
                }
                const widgetsJsonParentPath = widgetsJsonPath.getParentPath();
                return parseLibraryDescriptor(pkg.name, body.data, widgetsJsonParentPath, root);
            }
        })
    } else {
        // the "widgets.json" data is presented inline in package.json
        debugger;
        deferred = parseLibraryDescriptor(pkg.name, pkg.scripts.widget_metadata, path, root);
    }
    //}
    /*
    if (lang.exists('scripts.callbacks', pkg)) {
        const d = new Deferred();
        require([pkg.scripts.callbacks], cb => {
            pkg.$callbacks = cb;
            d.resolve();
        });
        deferredGets.push(d);
    }

    return deferred;
    */
    return deferred;
}

function parseLibraryDescriptor(libName, descriptor, descriptorParentFolderPath, moduleFolderPath?: any) {
    debug && console.log('parseLibraryDescriptor', arguments);
    let pkg = libraries[libName];
    const path = descriptorParentFolderPath;
    // XXX Should remove $descriptorFolderPath. This info is already stored in the packages
    //   structure; just use that. (NOTE: $descriptorFolderPath is also used by custom widgets)
    descriptor.$descriptorFolderPath = path.toString();
    descriptor.$moduleFolderPath = moduleFolderPath.toString();

    // Handle custom widgets, which call this function without first calling
    // parsePackage().
    if (!pkg) {
        libraries[libName] = {
            $wm: descriptor,
            name: descriptor.name,
            version: descriptor.version
        };
        // NOTE: Custom widgets include __metadataModuleId on the descriptor
        if (descriptor.__metadataModuleId) {
            libraries[libName].__metadataModuleId = descriptor.__metadataModuleId;
        }
        pkg = libraries[libName];
    } else if (pkg.$widgets) {
        descriptor.widgets.forEach(item => {
            pkg.$wm.widgets.push(item);
        });
        for (const name in descriptor.categories) {
            if (!pkg.$wm.categories.hasOwnProperty(name)) {
                pkg.$wm.categories[name] = descriptor.categories[name];
            }
        }
    } else if (pkg.$wm) {
        /* metadata already exists, mix the new widgets with old */
        for (let z = 0; z < descriptor.widgets.length; z++) {
            let found = false;
            for (let ll = 0; !found && ll < pkg.$wm.widgets.length; ll++) {
                if (pkg.$wm.widgets[ll].type == descriptor.widgets[z].type) {
                    found = true;
                }
            }

            if (!found) {
                pkg.$wm.widgets.push(descriptor.widgets[z]);
            }
        }

    } else if (!pkg.$wm) {
        // XXX For now, put data from widgets.json as sub-property of package.json
        //   data.  Later, this should be split up into separate APIs.
        //
        //   libraries[] = pkg = {
        //       name:
        //       description:
        //       version:
        //       directories: {
        //           lib:
        //           metadata:
        //       }
        //       scripts: {
        //           widget_metadata:  URL
        //       }
        //       $wm: {    // from widgets.json
        //          categories: {}
        //          widgets: []
        //          $providedTypes: {} - assoc attray, each entry points to a widget descriptor
        //          $providedTags: {} - assoc array, each entry points to an array of widget descriptors
        //          $descriptorFolderPath:
        //          $moduleFolderPath:
        //       }
        //       $callbacks:  JS
        //   }
        pkg.$wm = descriptor;
    }

    const wm = pkg.$wm;

    function addTag(wm, tag, item) {
        if (typeof wm.$providedTags[tag] == 'undefined') {
            wm.$providedTags[tag] = [];
        }
        wm.$providedTags[tag].push(item);
    }

    wm.$providedTypes = wm.$providedTypes || {};
    wm.$providedTags = wm.$providedTags || {};

    wm.widgets.forEach(item => {
        wm.$providedTypes[item.type] = item;
        // In widgets.json, item.tags can be either a string or an array of strings.
        if (typeof item.tags == 'string') {
            addTag(wm, item.tags, item);
        } else if (item.tags && item.tags.length) {
            for (let tagindex = 0; tagindex < item.tags.length; tagindex++) {
                addTag(wm, item.tags[tagindex], item);
            }
        }
        if (item.icon && !item.iconLocal) {
            item.icon = path.append(item.icon).toString();
        }
        if (item.iconLarge && !item.iconLargeLocal) {
            item.iconLarge = path.append(item.iconLarge).toString();
        }
        item.widgetClass = wm.categories[item.category].widgetClass;
    });

    // mix in descriptor instance functions
    mixin(wm, {
        /**
         * Get a translated string for this library
         * @param key
         * @returns {String}
         */
        _maqGetString: getDescriptorString
    });

    // handle "extend"
    if (wm.extend) {
        for (const lib_name in wm.extend) {
            if (wm.extend.hasOwnProperty(lib_name)) {
                if (libraries[lib_name] && libraries[lib_name].$wm) {
                    handleLibExtends(libraries[lib_name].$wm, [wm.extend[lib_name]]);
                } else {
                    const ext = libExtends[lib_name] || [];
                    ext.push(wm.extend[lib_name]);
                    libExtends[lib_name] = ext;
                }
            }
        }
    }
    // is another library extending this library?
    if (libExtends[libName]) {
        handleLibExtends(wm, libExtends[libName]);
    }

    return pkg;
}

// Extend a "base" library metadata by doing mixin/concat of values specified
// by descendant library.
function handleLibExtends(wm, lib_extends) {
    function concat(val1, val2) {
        if (typeof val1 === 'string') {
            return val1 + ',' + val2;
        }
        if (val1 instanceof Array) {
            return val1.concat(val2);
        }
        console.error('Unhandled type for "concat()"');
    }

    const widgetTypes = wm.$providedTypes;
    lib_extends.forEach(ext => {
        for (const type in ext) {
            if (ext.hasOwnProperty(type)) {
                const e = ext[type];
                const w = widgetTypes[type /*.replace(/\./g, "/")*/];
                if (e.mixin) {
                    mixin(w, e.mixin);
                }
                if (e.concat) {
                    for (const prop in e.concat) {
                        if (e.concat.hasOwnProperty(prop)) {
                            const val = e.concat[prop];
                            // tslint:disable-next-line:prefer-conditional-expression
                            if (w[prop]) {
                                w[prop] = concat(w[prop], val);
                            } else {
                                w[prop] = val;
                            }
                        }
                    }
                }
            }
        }
    });
}

// XXX Changed to return package, rather than widgets.json object
function getLibraryForType(type) {
    if (type) {
        for (const name in libraries) {
            if (libraries.hasOwnProperty(name)) {
                const lib = libraries[name];
                if (lib.$wm && lib.$wm.$providedTypes[type]) {
                    return lib;
                }
            }
        }
    }
    return null;
}

function getWidgetDescriptorForType(type) {
    const lib = getLibraryForType(type);
    if (lib) {
        return lib.$wm.$providedTypes[type];
    }
}

function getWidgetsWithTag(tag) {
    let arr = [];
    if (tag) {
        for (const name in libraries) {
            if (libraries.hasOwnProperty(name)) {
                const lib = libraries[name];
                if (lib.$wm && lib.$wm.$providedTags[tag]) {
                    arr = arr.concat(lib.$wm.$providedTags[tag]);
                }
            }
        }
    }
    return arr;
}

let XXXwarned = false;

function getDescriptorString(key) {
    // XXX What to do about localization? (see initL10n)
    if (!XXXwarned) {
        //            console.warn("WARNING: NOT IMPLEMENTED: localization support for library descriptors");
        XXXwarned = true;
    }
    return null;
}

const getMetadata = (type) => {
    if (!type) {
        return undefined;
    }

    if (mdCache.hasOwnProperty(type)) {
        return mdCache[type];
    }

    // get path from library descriptor
    // debugger;
    const lib = getLibraryForType(type);

    let wm;
    let descriptorPath;
    if (lib) {
        descriptorPath = lib.$wm.$descriptorFolderPath;
    }
    if (!descriptorPath) {
        return null;
    }
    wm = lib.$wm;

    let metadata = null;
    let metadataUrl;
    const webRoot = RESOURCE_VARIABLES.APP_URL;
    //console.error('get metadata : web root : at ',webRoot);
    if (!wm.localPath) {
        metadataUrl = [descriptorPath, '/', type.replace(/\./g, '/'), '_oam.json'].join('');
        metadataUrl = webRoot + '/metadata/' + metadataUrl;
        //console.error('require : ' , metadataUrl);

        axios.get(metadataUrl).then(data => metadata = data);
        /*
        dojo.xhrGet({
            url: metadataUrl,
            handleAs: 'json',
            sync: true // XXX should be async
        }).then(data => {
            metadata = data;
        });
        */
    } else {

        // Remove first token on type because it duplicates the folder name for the module
        const typeWithSlashes = type.replace(/\./g, '/');
        const typeTokens = typeWithSlashes.split('/');
        typeTokens.shift();
        const typeAdjusted = typeTokens.join('/');
        metadataUrl = [wm.$moduleFolderPath, '/', typeAdjusted, '_oam.json'].join('');
        if (metadataUrl.indexOf('lib/custom') !== -1) {
            const store = ctx.getFileManager().getStore('workspace_user', false);
            return new Promise(resolve => {
                store._loadItem({
                    path: metadataUrl,
                    mount: 'workspace_user'
                }, true).then((item) => {
                    ctx.getFileManager().getContent(item.mount, item.path).then((content) => {
                        /*
                        metadata = dojo.fromJson(content);
                        metadata.$ownproperty = dojo.mixin({}, metadata.property);
                        metadata.property = dojo.mixin({}, defaultProperties, metadata.property);
                        // store location of this metadata file, since some resources are relative to it
                        metadata.$src = metadataUrl;
                        // XXX localize(metadata);
                        mdCache[type] = metadata;

                        // OAM may be overridden by metadata in widgets.json
                        deepMixin(metadata, wm.$providedTypes[type].metadata);
                        resolve(metadata);
                        */
                    });
                });
                return
            });
        }
        /*
        var resource = system.resource.findResource(metadataUrl);

        console.error('----');
        var content = resource.getContentSync();
        metadata = dojo.fromJson(content);
        */
    }

    if (!metadata) {
        console.error('ERROR: Could not load metadata for type: ' + type);
        return null;
    }

    metadata.$ownproperty = { ...metadata.property };
    metadata.property = { ...defaultProperties, ...metadata.property };
    // store location of this metadata file, since some resources are relative to it
    metadata.$src = metadataUrl;
    // XXX localize(metadata);
    mdCache[type] = metadata;

    // OAM may be overridden by metadata in widgets.json
    deepMixin(metadata, wm.$providedTypes[type].metadata);

    return metadata;
}

function queryProps(obj, queryString) {
    if (!queryString) { // if undefined, null or empty string
        return obj;
    }
    every(queryString.split('.'), name => {
        if (obj[name] === undefined) {
            obj = undefined;
            return false;
        }
        obj = obj[name];
        return true;
    });
    return obj;
}

function getAllowedElement(name, type) {
    const propName = 'allowed' + name;
    let prop = Metadata.queryDescriptor(type, propName);
    if (!prop) {
        // set default -- 'ANY' for 'allowedParent' and 'NONE' for
        // 'allowedChild'
        prop = name === 'Parent' ? 'ANY' : 'NONE';
    }
    return prop.split(/\s*,\s*/);
}

function getCanSelect(type) {
    const propName = 'canSelect';
    const prop = Metadata.queryDescriptor(type, propName);

    return prop ? prop.split(/\s*,\s*/) : [];
}

function getHelperId(type, helperType) {
    const value = Metadata.queryDescriptor(type, helperType);
    if (!value) {
        return null;
    }

    const lib = getLibraryForType(type);
    return getModuleId(lib, value);
}

function getModuleId(lib, module) {
    if (!lib || !module) {
        return null;
    }
    let moduleId;
    // tslint:disable-next-line:prefer-conditional-expression
    if (typeof module === 'string' && module.substr(0, 2) === './') {
        // if path is relative...
        moduleId = new Path(lib.__metadataModuleId).append(module).toString();
    } else {
        moduleId = module;
    }
    return moduleId;
}

export class Metadata {

    public static async getData(url) {
        return axios.get(url);
    }

    public static async getMetadata(type) {
        return new Promise((resolve, reject) => {
            if (!type) {
                return reject(type);
            }
            if (mdCache.hasOwnProperty(type)) {
                return resolve(mdCache[type]);
            }
            const lib = getLibraryForType(type);
            let wm;
            let descriptorPath;
            if (lib) {
                descriptorPath = lib.$wm.$descriptorFolderPath;
            }
            if (!descriptorPath) {
                return null;
            }
            wm = lib.$wm;

            let metadata = null;
            let metadataUrl;
            const webRoot = RESOURCE_VARIABLES.APP_URL;
            if (!wm.localPath) {
                metadataUrl = [descriptorPath, '/', type.replace(/\./g, '/'), '_oam.json'].join('');
                metadataUrl = webRoot + '/metadata/' + metadataUrl;

                this.getData(metadataUrl).then((data) => {
                    metadata = data.data;
                    if (typeof metadata === 'string') {
                        try {
                            metadata = JSON.parse(metadata)
                        } catch (e) {
                            console.error('error parseing metadata ' + metadataUrl, e);
                        }
                    }
                    if (!metadata) {
                        console.error('ERROR: Could not load metadata for type: ' + type);
                        return null;
                    }
                    metadata.$ownproperty = { ...metadata.property };
                    metadata.property = { ...defaultProperties, ...metadata.property };
                    // store location of this metadata file, since some resources are relative to it
                    metadata.$src = metadataUrl;
                    // XXX localize(metadata);
                    mdCache[type] = metadata;

                    // OAM may be overridden by metadata in widgets.json
                    deepMixin(metadata, wm.$providedTypes[type].metadata);
                    return resolve(metadata);
                });
            } else {
                // Remove first token on type because it duplicates the folder name for the module
                const typeWithSlashes = type.replace(/\./g, '/');
                const typeTokens = typeWithSlashes.split('/');
                typeTokens.shift();
                const typeAdjusted = typeTokens.join('/');
                metadataUrl = [wm.$moduleFolderPath, '/', typeAdjusted, '_oam.json'].join('');
                if (metadataUrl.indexOf('lib/custom') !== -1) {
                    const store = ctx.getFileManager().getStore('workspace_user', false);
                    return new Promise(resolve => {
                        store._loadItem({
                            path: metadataUrl,
                            mount: 'workspace_user'
                        }, true).then((item) => {
                            ctx.getFileManager().getContent(item.mount, item.path).then((content) => {
                                /*
                                metadata = dojo.fromJson(content);
                                metadata.$ownproperty = dojo.mixin({}, metadata.property);
                                metadata.property = dojo.mixin({}, defaultProperties, metadata.property);
                                // store location of this metadata file, since some resources are relative to it
                                metadata.$src = metadataUrl;
                                // XXX localize(metadata);
                                mdCache[type] = metadata;

                                // OAM may be overridden by metadata in widgets.json
                                deepMixin(metadata, wm.$providedTypes[type].metadata);
                                resolve(metadata);
                                */
                            });
                        });
                        return
                    });
                }
                /*
                var resource = system.resource.findResource(metadataUrl);

                console.error('----');
                var content = resource.getContentSync();
                metadata = dojo.fromJson(content);
                */
            }

            /*
            if (!metadata) {
                console.error('ERROR: Could not load metadata for type: ' + type);
                return null;
            }

            metadata.$ownproperty = mixin({}, metadata.property);
            metadata.property = mixin({}, defaultProperties, metadata.property);
            // store location of this metadata file, since some resources are relative to it
            metadata.$src = metadataUrl;
            // XXX localize(metadata);
            mdCache[type] = metadata;

            // OAM may be overridden by metadata in widgets.json
            deepMixin(metadata, wm.$providedTypes[type].metadata);

            resolve(metadata);*/
        })
    }

    /**
     * Read the library metadata for all the libraries linked in the user's workspace
     */
    prefix: string = '';
    static ctx: any = null;
    static init(_ctx: any = {}, root: string = RESOURCE_VARIABLES.META_ROOT) {
        const _require = require;
        ctx = _ctx;
        this.ctx = _ctx;

        const deferreds = [];
        // lazy-load Runtime in order to prevent circular dependency
        const thiz = this;
        const subs = [];
        const subs2 = [];
        return new Promise((resolve, reject) => {
            Promise.all(Library.getUserLibs().map((lib) => {
                let path = lib.metaRoot;
                path = path.replace('app/metadata/', '');
                if (path) {
                    // use cache-busting to assure that any development changes
                    // get picked up between library releases
                    //console.log('require ' + root + ' : ' + path + "/package.json" + "?" + info.revision);
                    let newRoot = null;
                    let newPath = null;
                    try {
                        if (lib.getRoot) {
                            newRoot = lib.getRoot();
                        }
                        if (lib.getMetaPath) {
                            newPath = lib.getMetaPath();
                        }
                    } catch (e) {

                    }
                    const url = (newRoot || root) + '/' + (newPath || path) + '/package.json' + '?';
                    debug && console.log('load lib ', lib);
                    subs.push(axios.get(url).then((body) => {
                        const data = parsePackage(body.data, (newPath || path), (newRoot || root));
                        debug && console.log('got meta : ' + url, data);
                        subs2.push(data);
                        // Promise.resolve(data);
                    }).catch((e) => {
                        console.error('error parsing package');
                    }));
                }
                //deferreds.push(axios.get((newRoot || root) + '/' + (newPath || path) + '/package.json' + '?')
            })).then(() => {
                Promise.all(subs).then(() => {
                    Promise.all(subs2).then(() => {
                        // console.log('done');
                        resolve();
                    });
                })
            })
        });

        /*
        return new Promise((resolve, reject) => {
            // const webRoot = ctx.getResourceManager().getVariable(types.RESOURCE_VARIABLES.APP_URL);
            //root = root.replace(webRoot, '');
            // debug && console.log('init meta data at ' + webRoot, Library.getUserLibs(Workbench.getProject()));
            // root = require.toUrl('xideve/metadata/');
            Library.getUserLibs().forEach(lib => {
                // XXX Shouldn't be dealing with 'package.json' here; that belongs in library.js
                // (or a combined object).  Putting it here for now, to quickly integrate.
                let path = lib.metaRoot;
                path = path.replace('app/metadata/', '');
                if (path) {
                    // use cache-busting to assure that any development changes
                    // get picked up between library releases
                    //console.log('require ' + root + ' : ' + path + "/package.json" + "?" + info.revision);
                    let newRoot = null;
                    let newPath = null;
                    try {
                        if (lib.getRoot) {
                            newRoot = lib.getRoot();
                        }
                        if (lib.getMetaPath) {
                            newPath = lib.getMetaPath();
                        }

                        deferreds.push(axios.get((newRoot || root) + '/' + (newPath || path) + '/package.json' + '?').then())

                        deferreds.push(dojo.xhrGet({
                            // XXX For now, 'package.json' lives inside the 'metadata' dir.  Will need to
                            // move it up to the top level of library.
                            //require http://localhost/projects/x4mm/Code/client/src/lib/xideve/metadata/dojo/1.8/package.json?
                            url: (newRoot || root) + '/' + (newPath || path) + '/package.json' + '?',
                            handleAs: 'json'
                        }).then(data => parsePackage(data, (newPath || path), (newRoot || root))));

                    } catch (e) {
                        console.error('error parsing library ' + lib.id, e);
                    }
                }
            });
        });
        */
        // add the users custom widgets to the library metadata
        //if(descriptor.custom.length > 0 ) parseLibraryDescriptor(descriptor.custom.name, descriptor.custom, descriptor.custom.metaPath);
        // return all(deferreds);
    }

    // used to update a library descriptor after the fact
    parseMetaData(name, descriptor, descriptorFolderPath, moduleFolderPath) {
        return parseLibraryDescriptor(name, descriptor, descriptorFolderPath, moduleFolderPath);
    }

    /**
     * Get library metadata.
     * @param {String} [name]
     * 			Library identifier.
     * @returns library metadata if 'name' is defined; otherwise, returns
     * 			array of all libraries' metadata.
     */
    // XXX Note: this return package info now.
    static getLibrary(name?: string) {
        return name ? libraries[name] : libraries;
    }

    static getLibraries() {
        return libraries;
    }

    getLibraryActions(actionSetId, targetID) {
        const actions = [];
        for (const name in libraries) {
            if (libraries.hasOwnProperty(name)) {
                const lib = libraries[name];
                const wm = lib.$wm;
                if (!wm) {
                    continue;
                }
                const libActionSets = lib.$wm['davinci.actionSets'];
                if (!libActionSets) {
                    continue;
                }
                dojo.forEach(libActionSets, libActionSet => {
                    if (libActionSet.id == actionSetId) {
                        if (!targetID || (libActionSet.targetID === targetID)) {
                            const clonedActions = dojo.clone(libActionSet.actions);
                            dojo.forEach(clonedActions, action => {
                                // May need to transform the action class string to
                                // account for the library's name space
                                if (action.action) {
                                    const newActionModuleId = getModuleId(lib, action.action);
                                    action.action = newActionModuleId;
                                }
                                if (action.menu) {
                                    action.menu.forEach(item => {
                                        if (item.action) {
                                            const newActionModuleId = getModuleId(lib, item.action);
                                            item.action = newActionModuleId;
                                        }
                                    });
                                }
                                actions.push(action);
                            });
                        }
                    }
                });
            }
        }
        return actions;
    }

    loadThemeMeta(model) {
        // try to find the theme using path magic
        const style = model.find({
            elementType: 'HTMLElement',
            tag: 'style'
        });
        const imports = [];
        const claroThemeName = 'claro';
        let claroThemeUrl;
        for (let z = 0; z < style.length; z++) {
            for (let i = 0; i < style[z].children.length; i++) {
                if (style[z].children[i].elementType == 'CSSImport') {
                    imports.push(style[z].children[i]);
                }
            }
        }

        const themePath = new Path(model.fileName);
        /* remove the .theme file, and find themes in the given base location */
        const allThemes = Library.getThemes(Workbench.getProject());
        const themeHash = {};
        for (let i = 0; i < allThemes.length; i++) {
            if (allThemes[i].files) { // #1024 theme maps do not have files
                for (let k = 0; k < allThemes[i].files.length; k++) {
                    themeHash[allThemes[i].files[k]] = allThemes[i];
                }
            }
        }

        /* check the header file for a themes CSS.
         *
         * TODO: This is a first level check, a good second level check
         * would be to grep the body classes for the themes className. this would be a bit safer.
         */

        for (let i = 0; i < imports.length; i++) {
            let url = imports[i].url;
            /* trim off any relative prefix */
            // tslint:disable-next-line:forin
            for (let themeUrl in themeHash) {
                if (themeUrl.indexOf(claroThemeName) > -1) {
                    claroThemeUrl = themeUrl;
                }
                if (url.indexOf(themeUrl) > -1) {
                    return {
                        themeUrl: url,
                        themeMetaCache: Library.getThemeMetadata(themeHash[themeUrl]),
                        theme: themeHash[themeUrl]
                    };
                }
            }
        }

        // check for single mobile theme's
        const ro = Metadata._loadThemeMetaDojoxMobile(model, themeHash);
        if (ro) {
            return ro;
        }

        // If we are here, we didn't find a cross-reference match between
        // CSS files listed among the @import commands and the themes in
        // themes/ folder of the user's workspace. So, see if there is an @import
        // that looks like a theme reference and see if claro/ is in
        // the list of themes, if so, use claro instead of old theme
        if (claroThemeUrl) {
            const newThemeName = claroThemeName;
            let oldThemeName;
            for (let i = 0; i < imports.length; i++) {
                const cssfilenamematch = imports[i].url.match(/\/([^\/]*)\.css$/);
                if (cssfilenamematch && cssfilenamematch.length == 2) {
                    const cssfilename = cssfilenamematch[1];
                    const themematch = imports[i].url.match(new RegExp('themes/' + cssfilename + '/' + cssfilename + '.css$'));
                    if (themematch) {
                        oldThemeName = cssfilename;
                        break;
                    }
                }
            }
            /*
            if (oldThemeName) {
                // Update model
                const htmlElement = model.getDocumentElement();
                const head = htmlElement.getChildElement('head');
                const bodyElement = htmlElement.getChildElement('body');
                const classAttr = bodyElement.getAttribute('class');
                if (classAttr) {
                    bodyElement.setAttribute('class', classAttr.replace(new RegExp('\\b' + oldThemeName + '\\b', 'g'), newThemeName));
                }
                const styleTags = head.getChildElements('style');
                dojo.forEach(styleTags, styleTag => {
                    dojo.forEach(styleTag.children, styleRule => {
                        if (styleRule.elementType == 'CSSImport') {
                            styleRule.url = styleRule.url.replace(new RegExp('/' + oldThemeName, 'g'), '/' + newThemeName);
                        }
                    });
                });
                // Update data in returnObject
                let url = imports[i].url.replace(new RegExp('/' + oldThemeName, 'g'), '/' + newThemeName);
                const returnObject = {
                    themeUrl: url,
                    // Pull claro theme data
                    themeMetaCache: Library.getThemeMetadata(themeHash[claroThemeUrl]),
                    theme: themeHash[claroThemeUrl]
                };
                returnObject.themeMetaCache.usingSubstituteTheme = {
                    oldThemeName: oldThemeName,
                    newThemeName: newThemeName
                };
                // Make sure source pane updates text from model

                return returnObject;
            }
            */
        }
    }

    // FIXME this bit of code should be moved to toolkit specific ////////////////////////////////////////////////////////////
    /**
     * Returns the theme meta data if the current theme of the page is dojox.mobile.deviceTheme
     *
     * @param model {Object}
     * @param themeHash {Hash}
     * @returns {Object} theme
     */
    static _loadThemeMetaDojoxMobile(model: any, themeHash: any): object {
        const scriptTags = model.find({
            elementType: 'HTMLElement',
            tag: 'script'
        });
        for (let s = 0; s < scriptTags.length; s++) {
            const text = scriptTags[s].getElementText();
            if (text.length) {
                // Look for a dojox.mobile.themeMap in the document, if found set the themeMap
                let start = text.indexOf('dojoxMobile.themeMap');
                if (start > 0) {
                    start = text.indexOf('=', start);
                    const stop = text.indexOf(';', start);
                    if (stop > start) {
                        const themeMap = dojo.fromJson(text.substring(start + 1, stop));
                        const url = themeMap[0][2][0];
                        /* trim off any relative prefix */
                        for (const themeUrl in themeHash) {
                            if (url.indexOf(themeUrl) > -1) {
                                return {
                                    themeUrl: url,
                                    themeMetaCache: Library.getThemeMetadata(themeHash[themeUrl]),
                                    theme: themeHash[themeUrl]
                                };
                            }
                        }
                    }
                }
            }
        }
        return;
    }
    // FIXME end of dojox mobile  ////////////////////////////////////////////////////////////////

    /**
     * Returns the descriptor for the library which contains the given
     * widget type
     * @param type {string} widget type
     * @returns {Object} library JSON descriptor
     */
    // XXX This now returns the package metadata (which includes widgets metadata at
    //    pkg.$wm).  All external callers just want pkg.name -- that should come
    //    from a packages API (i.e. getPackage().name).
    static getLibraryForType(type: string): any {
        return getLibraryForType(type);
    }

    getLibraryMetadataForType(type) {
        const lib = getLibraryForType(type);
        return lib ? lib.$wm : null;
    }

    /**
     * Returns the widget descriptor object corresponding to a given widget type.
     * @param  {String} type
     * @return {object}
     */
    getWidgetDescriptorForType(type: string): object {
        return getWidgetDescriptorForType(type);
    }

    /**
     * Returns a descriptive property (e.g., description or title) out
     * of an OpenAjax Metadata object (JS object for the foo_oam.json file).
     * corresponding to a given widget type.
     * @param  {String} type  widget type (e.g., 'dijit.form.Button')
     * @param  {String} propName  property name (e.g., 'description')
     * @return {null|object} null if property doesn't exist, otherwise an object with two properties:
     *    type: either 'text/plain' or 'text/html'
     *    value: the value of the property
     */
    getOamDescriptivePropertyForType(type: string, propName: string): null | object {
        const oam = Metadata.getMetadata(type);
        if (oam && oam[propName]) {
            const propValue = oam[propName];
            if (typeof (propValue) == 'string') {
                return {
                    type: 'text/plain',
                    value: propValue
                };
            } else if (typeof propValue.value == 'string') {
                return {
                    type: (propValue.type ? propValue.type : 'text/plain'),
                    value: propValue.value
                };
            } else {
                return null;
            }
        } else {
            return null
        }
    }

    /**
     * Returns an array of widget descriptors for all widgets
     * whose 'tags' property includes the given tag
     * @param  {String} tag
     * @return {Array(object)}
     */
    getWidgetsWithTag(tag: string): Array<any> {
        return getWidgetsWithTag(tag);
    }

    getLibraryBase(type) {
        const lib = getLibraryForType(type);
        if (lib) {
            return lib.$wm.$descriptorFolderPath;
        }
    }

    /**
     * Invoke the callback function, if implemented by the widget library.
     * @param libOrType {object|string} widget library object or widget type
     * @param fnName {string} callback function name
     * @param args {?Array} arguments array to pass to callback function
     */
    // XXX make this part of a mixin for the library metadata obj
    static invokeCallback(libOrType: any, fnName: string, args: Array<any> | null) {
        //@ximpl.

        let library = libOrType;
        let fn;
        if (typeof libOrType === 'string') {
            library = getLibraryForType(libOrType);
        }
        if (library && library.$callbacks) {
            fn = library.$callbacks[fnName];
            if (fn) {
                return fn.apply(library.$callbacks, args);
            }
        }

        // XXX handle/report errors?
    }
    /**
     * @param {String|Object} widget
     *            Can be either a string of the widget type (i.e. "dijit.form.Button") or
     *            a davinci.ve._Widget instance.
     * @param queryString
     * @return 'undefined' if there is any error; otherwise, the requested data.
     */
    public static async query(widget: any, queryString?: string) {
        if (!widget) {
            return;
        }

        let type;
        let metadata;
        if (widget.declaredClass) { // if instance of davinci.ve._Widget
            if (widget.metadata) {
                metadata = widget.metadata;
            }
            type = widget.type;
        } else {
            type = widget;
        }

        if (!metadata) {
            metadata = await Metadata.getMetadata(type);
            if (!metadata) {
                return;
            }
            if (widget.declaredClass) {
                widget.metadata = metadata;
            }
        }

        return queryProps(metadata, queryString);
    }
    /**
     * queryDescriptorByName queries by widget metadata info using
     * the 'name' value, such as "Button".
     * The 'type' must be provided too (e.g., 'dijit.form.Button')
     * to make sure we find the right library for the given widget name.
     *
     * @param {String} name
     * @param {String} type
     *            Widget type (i.e. "dijit.form.Button")
     * @param queryString
     * @return 'undefined' if there is any error; otherwise, the requested data.
     */
    static queryDescriptorByName(name: string, type: string, queryString) {
        const lib = getLibraryForType(type);
        let item;
        if (lib) {
            const widgets = lib.$wm.widgets;
            for (let i = 0; i < widgets.length; i++) {
                if (widgets[i].name == name) {
                    item = widgets[i];
                    break;
                }
            }
        }
        return this._queryDescriptor(item, queryString);
    }
    /**
     * queryDescriptor queries by widget metadata info by
     * the 'type' value, such as dijit.form.Button
     *
     * @param {String} type
     *            Widget type (i.e. "dijit.form.Button")
     * @param queryString
     * @return 'undefined' if there is any error; otherwise, the requested data.
     */
    static queryDescriptor(type: string, queryString) {
        const lib = getLibraryForType(type);
        let item;
        if (lib) {
            item = lib.$wm.$providedTypes[type];
        }
        return this._queryDescriptor(item, queryString);
    }
    /**
     * @param {Object} item		Descriptor object
     * @param queryString
     * @return 'undefined' if there is any error; otherwise, the requested data.
     */
    static _queryDescriptor(item: object, queryString) {
        if (!item || typeof item !== 'object') {
            return;
        }

        let value = queryProps(item, queryString);

        // post-process some values
        if (queryString === 'resizable') {
            // default to "both" if not defined
            if (!value) {
                value = 'both';
            }
        }
        return value;
    }
    /**
     * Return value of 'allowedParent' property from widget's descriptor.
     * If widget does not define that property, then it defaults to ['ANY'].
     *
     * @param {String} type
     * 			Widget type (i.e. "dijit.form.Button")
     * @returns Array of allowed widget types or ['ANY']
     * @type {[String]}
     */
    static getAllowedParent(type: string) {
        return getAllowedElement('Parent', type);
    }
    /**
     * Return value of 'allowedChild' property from widget's descriptor.
     * If widget does not define that property, then it defaults to ['NONE'].
     *
     * @param {String} type
     * 			Widget type (i.e. "dijit.form.Button")
     * @returns Array of allowed widget types, ['ANY'] or ['NONE']
     * @type {[String]}
     */
    static getAllowedChild(type: string) {
        return getAllowedElement('Child', type);
    }
    static getCanSelect(parentType) {
        return getCanSelect(parentType);
    }
    // getMetadata: getMetadata,
    /**
     * Returns the object instance or module ID of the given "helper" type.
     * Only works with:
     *     'helper'
     *     'tool'
     *     'inlineEdit'
     *
     * Note: return values are cached.
     *
     * @param  {String} type
     *             Widget type (i.e. "dijit/form/Button")
     * @param  {String} helperType
     *             One of the accepted 'helper' types (see description)
     * @return {Deferred}
     */
    static getHelper(type: string, helperType: string) {
        return new Promise((resolve, reject) => {

            const idx = type + ':' + helperType;

            if (idx in helperCache) {
                return resolve(helperCache[idx]);
            }

            const moduleId = getHelperId(type, helperType);

            // console.warn('getHelper ximpl ' + type + ' : ' + moduleId, new Error().stack);

            const id = type.indexOf('delite');
            if (!moduleId) {
                resolve();
            } else {
                if (type.indexOf('delite') !== -1) {
                    helperCache[idx] = DeliteHelper;
                    resolve(DeliteHelper);
                } else {
                    console.error('cant resolve widget helper : ' + type);
                    resolve();
                }
                /*
                require([moduleId], module => {
                    resolve(module);
                    helperCache[idx] = module;
                });
                */
            }
        });

        /*
        //@ximpl.
        const d = new Deferred();
        const idx = type + ':' + helperType;

        if (idx in helperCache) {
            d.resolve(helperCache[idx]);
            return d;
        }

        const moduleId = getHelperId(type, helperType);
        if (!moduleId) {
            d.resolve();
        } else {
            require([moduleId], module => {
                d.resolve(module);
                helperCache[idx] = module;
            });
        }

        return d;
        */
    }

    /**
     * Returns the SmartInput instance for the given `type`.
     * @param  {String} type Widget type (i.e. "dijit.form.Button")
     * @return {Object}
     */
    getSmartInput(type: string): any {
        /*
        const d = new Deferred();
        if (type in smartInputCache) {
            d.resolve(smartInputCache[type]);
        } else {
            const moduleId = getHelperId(type, 'inlineEdit');
            if (!moduleId) {
                d.resolve(null);
            } else if (typeof moduleId === 'string') {
                require([moduleId], Module => {

                    d.resolve(smartInputCache[type] = new Module());
                });
            } else if (Object.prototype.toString.call(moduleId.property) === '[object Array]') {
                // `moduleId` is an object
                require(['davinci/ve/input/MultiFieldSmartInput'], MultiFieldSmartInput => {
                    const si = new MultiFieldSmartInput();
                    mixin(si, moduleId);
                    d.resolve(smartInputCache[type] = si);
                });
            } else {
                // `moduleId` is an object
                require(['davinci/ve/input/SmartInput'], SmartInput => {
                    const si = new SmartInput();
                    mixin(si, moduleId);
                    d.resolve(smartInputCache[type] = si);
                });
            }
        }

        return d;
        */
    }

    /**
     * Returns any deferred objects that need to be completed before
     * a visual editor should begin processing.
     */
    getDeferreds() {
        return deferredGets;
    }
};

//dojo.setObject('davinci.ve.metadata', Metadata);
// });
