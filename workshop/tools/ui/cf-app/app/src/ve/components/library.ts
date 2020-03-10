// XXX This probably shouldn't depend on davinci/ve/metadata.  This object should
//   only concern itself with the notion of a library.  Metadata is handled
//   elsewhere.
/*
define([
    'dojo/_base/xhr',
    'dojo/Deferred',
    './Runtime',
    './model/Path',
    './workbench/Preferences',
    'dojo/_base/kernel',
    'dojo/promise/all',
    'xide/model/Path',
    'xide/types',
    'xide/utils',
    'davinci/ve/metadata'
], function (xhr, Deferred, Runtime, Path Preferences, dojo, all, _Path, types, utils, Metadata) {
*/

import { Path } from './'
import { libs, themes } from './lib_data';
/*
 *
 * hard coded libraries for now, should be generated/server based in future.
 *
 * library name: user readable name
 * library ID: library ID based on lib and version, every library/version should have unique ID.  if non given highest lvl on server assumed.
 */
let library = {
    _customWidgets: {}
};

const _themesCache: any = {};
const _themesMetaCache = {};
let _userLibsCache: any = {};
let _libRootCache: any = {};
const dojo: any = {};
const system: any = {};
const Preferences: any = {};

// Cache library roots so we don't make multiple server calls for the same 'id' and 'version'.  But
// clear the cache when any of the libraries change.
//@ximpl.
/*
dojo.subscribe('/davinci/ui/libraryChanged/start', this, () => {
    _libRootCache = {};
    _userLibsCache = {};
});
*/
/* if resources are deleted, we need to check if they are themes.  if so dump the theme cache so its resynced */
/*
dojo.subscribe("/davinci/resource/resourceChanged", this, function (type, changedResource) {
    var Workbench = require("davinci/Workbench");
    var base = Workbench.getProject();
    if (type == 'deleted' || type == 'renamed') {
        // This may seem excessive to delete the  cache on a delete or rename
        // but the user could delete the parent folder which effectivly deletes the .theme file
        // but we are only notified of the Folers deletion so safest to delete the cache.
        var prefs = Preferences.getPreferences('davinci.ui.ProjectPrefs', base);
        var projectThemeBase = new Path(base).append(prefs.themeFolder);
        var resourcePath = new Path(changedResource.getPath());
        if (resourcePath.startsWith(projectThemeBase)) {
            delete _themesCache[base];
        }
    }

    if (changedResource.elementType == 'File' && changedResource.extension == "theme") {
        // creates we don't do anything with the file is not baked yet
        if (type == 'modified') {
            changedResource.getContent().then(function (content) {
                var t = JSON.parse(content);
                t.path = [changedResource.getPath()];
                t.getFile = function () {
                    return system.resource.findResource(this.path[0]);
                }.bind(t);

                for (var i = 0; i < _themesCache[base].length; i++) {
                    if (_themesCache[base][i].name == t.name) {
                        // found theme so replace it
                        _themesCache[base][i] = t;
                        return;
                    }
                }

                // theme not found so add it.
                _themesCache[base].push(t);
            }.bind(this));
        }
    }
});
*/

/* singleton */
export class Library {
    _customWidgetDescriptors: {};
    _customWidgetPackages: any[];
    static _serverLibs: any;
    themesChanged(base) {
        _themesCache[base] = base ? null : [];
    }
    static getThemes(base, workspaceOnly?: any, flushCache?: boolean) {
        if (flushCache) {
            delete _themesCache[base];
        }

        function result() {
            /* filters out workspace/non workspace values  before returning them.  always caches ALL themes */
            let rlt = [];
            if (_themesCache[base]) {
                rlt = workspaceOnly ?
                    _themesCache[base].filter(entry => !entry.getFile().isVirtual()) :
                    _themesCache[base];
            }
            return rlt;
        }

        if (_themesCache[base]) {
            return result();
        }

        // const prefs = Preferences.getPreferences('davinci.ui.ProjectPrefs', base);
        const themeFolder = 'themes';
        const projectThemeBase = new Path(base).append(themeFolder);
        const allThemes = themes;
        allThemes.forEach((theme: any) => {
            theme.getFile = () => {
                return system.resource.findResource(this.path[0]);
            }.bind(theme);
        });

        _themesCache[base] = allThemes;

        return result();
    }
    static getThemeMetadata(theme) {
        /* load/find theme metadata files */

        if (_themesMetaCache[theme.name]) {
            return _themesMetaCache[theme.name];
        }

        return null;
    }
    addCustomWidgets(customWidgetResource, moduleFolderPath, customWidgetJson) {
        const metaDfd = new Deferred();
        const base = 'project1';
        const descriptorFolderResource = customWidgetResource.getParent();
        const descriptorFolderString = descriptorFolderResource.getPath();
        const descriptorFolderPath = new Path(descriptorFolderString);
        // const newJson = require('davinci/ve/metadata').parseMetaData(customWidgetJson.name, customWidgetJson, descriptorFolderPath, moduleFolderPath);
        //@ximpl.
        const newJson = {};
        if (!library._customWidgets) {
            library._customWidgets = {}
        }
        if (!library._customWidgets[base]) {
            library._customWidgets[base] = {};
        }
        if (!library._customWidgets[base].hasOwnProperty('name')) {
            library._customWidgets[base].name = 'custom';
            library._customWidgets[base].metaPath = './lib/custom';
            library._customWidgets[base].localPath = true;
        }
        library._customWidgets[base] = newJson;
        dojo.publish('/davinci/ui/addedCustomWidget', [newJson]);
        return newJson;

        /*
        var prefs = Preferences.getPreferences('davinci.ui.ProjectPrefs', base);
        if (!prefs.widgetFolder) {
            prefs.widgetFolder = "./lib/custom";
            Preferences.savePreferences('davinci.ui.ProjectPrefs', base, prefs);
        }
        var descriptorFolderResource = customWidgetResource.getParent();
        var descriptorFolderString = descriptorFolderResource.getPath();
        var descriptorFolderPath = new Path(descriptorFolderString);

        var newJson = require("davinci/ve/metadata").parseMetaData(customWidgetJson.name, customWidgetJson, descriptorFolderPath, moduleFolderPath);
        if (!library._customWidgets[base].hasOwnProperty("name")) {

            library._customWidgets[base].name = 'custom';
            library._customWidgets[base].metaPath = prefs.widgetFolder;
            library._customWidgets[base].localPath = true;
        }
        library._customWidgets[base] = newJson;
        dojo.publish("/davinci/ui/addedCustomWidget", [newJson]);
        return newJson;
        */
    }
    //For developer notes on how custom widgets work in Maqetta, see:
    //https://github.com/maqetta/maqetta/wiki/Custom-widgets
    _getCustomWidgets(base) {

        if (!library._customWidgets || !library._customWidgets[base]) {
            // load the custom widgets from the users workspace

            if (!library._customWidgets) {
                library._customWidgets = {};
            }
            if (!library._customWidgets[base]) {
                library._customWidgets[base] = [];
            }

            const prefs = Preferences.getPreferences('davinci.ui.ProjectPrefs', base);
            if (!prefs.widgetFolder) {
                prefs.widgetFolder = './lib/custom';
                Preferences.savePreferences('davinci.ui.ProjectPrefs', base, prefs);
            }

            //http://192.168.1.37:81/x4mm/Code/trunk/xide-php/maqetta/cmd/listFiles.php?path=.%2Fproject1&basePath=.%2F
            //[{"name":"lib","isDir":true,"readOnly":true,"isNew":false,"isDirty":false,"directory":true,"children":[],"_EX":false,"size":0},{"name":"app.css","isDir":false,"readOnly":false,"isNew":false,"isDirty":false},{"name":"samples","isDir":true,"readOnly":false,"isNew":false,"isDirty":false,"directory":true,"children":[],"_EX":false,"size":0},{"name":"themes","isDir":true,"readOnly":false,"isNew":false,"isDirty":false,"directory":true,"children":[],"_EX":false,"size":0},{"name":"iphone.html","isDir":false,"readOnly":false,"isNew":false,"isDirty":false},{"name":"app.js","isDir":false,"readOnly":false,"isNew":false,"isDirty":false},{"name":"iphone_test.html","isDir":false,"readOnly":false,"isNew":false,"isDirty":false}]
            //XIDE_Directory_Service.ls : ws/project1 : '[name:ws]'

            const widgetFolderSetting = new Path(base).append(prefs.widgetFolder);
            const fullPath = widgetFolderSetting.getSegments();
            let parent = system.resource.findResource(fullPath[0]);
            for (let i = 1; i < fullPath.length; i++) {
                const folder = parent.getChild(fullPath[i]);
                //var folder = parent.getChildSync(fullPath[i]);
                //console.error('lib : get child sync : ' +fullPath[i]);
                // tslint:disable-next-line:prefer-conditional-expression
                if (folder) {
                    parent = folder;
                } else {
                    parent = parent.createResource(fullPath[i], true);
                }
            }

            let custom_children;
            parent.getChildren(function onComplete(children) {
                custom_children = children;
            }, true);
            this._customWidgetPackages = [];
            if (custom_children == null) {
                custom_children = [];
            }
            const moduleFolderPaths = {};
            for (let i = 0; i < custom_children.length; i++) {
                const childResource = custom_children[i];
                if (childResource.elementType == 'Folder') {
                    moduleFolderPaths[childResource.name] = childResource.getPath();
                    const maq_name = 'maq-lib-custom-' + childResource.name;
                    const url = childResource.getURL();
                    /*
                    //@ximpl.
                    require({
                        packages: [{
                            name: maq_name,
                            location: url
                        }]
                    });*/
                    this._customWidgetPackages.push({
                        name: childResource.name,
                        location: url
                    });
                }
            }

            const customWidgets = system.resource.findResource('*_widgets.json', false, parent);

            this._customWidgetDescriptors = {};
            for (let i = 0; i < customWidgets.length; i++) {
                const customWidgetResource = customWidgets[i];
                const parentResource = customWidgetResource.getParentFolder();
                const parentUrl = parent.getURL();
                const metadataUrl = parentResource.getURL();
                const metadataUrlRelative = metadataUrl.substr(parentUrl.length + 1);
                let metadata = null;
                try {
                    //FIXME: Make all of this asynchronous
                    //One way to do this would be to consolidate all of the getuserlib calls into a single
                    //server call that returns a whole bunch of things at once, and then make that call asynchronous.
                    metadata = dojo.fromJson(customWidgetResource.getContentSync());
                } catch (e) {
                    console.log('Error loading or parsing custom widget metadata file: ' + metadataUrlRelative);
                }
                if (!metadata) {
                    console.warn('No metadata loaded for custom widget: ' + metadataUrlRelative);
                    continue;
                }
                if (!metadata.customWidgetSpec) {
                    console.warn('Unsupported older custom widget spec version (' + metadata.customWidgetSpec + ') for custom widget: ' + metadataUrlRelative);
                    continue;
                }
                const customModuleId = metadataUrlRelative.split('/').shift(); // first folder name after "custom"
                metadata.__metadataModuleId = 'maq-lib-custom-' + customModuleId;
                library.addCustomWidgets(base, customWidgetResource, moduleFolderPaths[customModuleId], metadata);
                if (!_libRootCache[base]) {
                    _libRootCache[base] = {};
                }
                if (!_libRootCache[base][parentResource.name]) {
                    _libRootCache[base][parentResource.name] = {};
                }
                _libRootCache[base][parentResource.name][metadata.version] = metadataUrl;

                if (metadata && metadata.widgets) {
                    for (let j = 0; j < metadata.widgets.length; j++) {
                        const widgetType = metadata.widgets[j].type;
                        if (widgetType) {
                            this._customWidgetDescriptors[widgetType] = {
                                name: customModuleId,
                                location: metadataUrl,
                                descriptor: metadata
                            };
                        }
                    }
                }
            }
        }
        return {
            custom: library._customWidgets[base]
        };
    }
    getCustomWidgets() {
        let custom_children;
        this._customWidgetPackages = [];
        const moduleFolderPaths = {};
        const allPromises = [];
        if (!library.ctx) {
            console.error('library has no context');
            return null;
        }
        const fmgr = library.ctx.getFileManager();
        if (!fmgr) {
            console.error('have no file manager');
            return null;
        }

        const store = fmgr.getStore('workspace_user');
        const customWidgets = [];

        const subPromisese = []; // folder parser promises
        const head = new Deferred();
        const base = 'project1';
        fmgr.mkdir('workspace_user', './lib/custom').then(() => {
            const custom = store.getItem('./lib/custom', true).then((folder) => {
                folder.getChildren().forEach((item) => {
                    if (item.directory === true) {
                        subPromisese.push(store._loadItem(item, true).then((sub) => {
                            moduleFolderPaths[item.name] = item.getPath();
                            const maq_name = 'maq-lib-custom-' + item.name;
                            // const req = require;
                            // const url = req.toUrl('workspace') + '/lib/custom/' + item.name;
                            /*
                            //@ximpl.
                            require({
                                packages: [{
                                    name: maq_name,
                                    location: url
                                }]
                            });
                            */
                            this._customWidgetPackages.push({
                                name: item.name,
                                location: url
                            });
                            customWidgets.push(item);
                        }));
                    }

                    all(subPromisese).then(() => {
                        customWidgets.forEach((item) => {
                            const widgetItemPath = item.getPath() + '/' + item.name + '_widgets.json';
                            const widgetItem = store.getSync(widgetItemPath);
                            const dfd = new Deferred();
                            allPromises.push(dfd);

                            library.ctx.getFileManager().getContent(widgetItem.mount, widgetItem.path).then((content) => {
                                const meta = utils.getJson(content);
                                const customModuleId = item.name;
                                meta.__metadataModuleId = 'maq-lib-custom-' + customModuleId;
                                try {
                                    library.addCustomWidgets(widgetItem, moduleFolderPaths[customModuleId], meta);
                                } catch (e) {
                                    console.error('error parsing custom widget ' + item.name, e);
                                };

                                const c = Metadata.getMetadata(meta.name + '/' + meta.name);
                                if (c.then) {
                                    c.then(() => {
                                        dfd.resolve()
                                    })
                                } else {
                                    dfd.resolve();
                                }
                            });
                        });

                        all(allPromises).then(() => {
                            head.resolve({
                                custom: library._customWidgets[base]
                            });
                        })
                    });

                });
            });
        });
        return head;
    }
    getCustomWidgetPackages() {
        return this._customWidgetPackages || [];
    }
    getCustomWidgetDescriptors() {
        return this._customWidgetDescriptors ? this._customWidgetDescriptors : {};
    }
    getInstalledLibs() {
        /*
        if (!library._serverLibs) {
            library._serverLibs = Runtime.serverJSONRequest({
                url: 'cmd/listLibs',
                handleAs: 'json',
                content: {},
                sync: true
            })[0].userLibs;
        }
        console.log('-get installed libs', library._serverLibs);
        return library._serverLibs;
        */
    }
    static getUserLibs(base: string = 'project1') {
        // not sure if we want to only allow the logged in user to view his/her
        // installed libs, or to include user name in request of target user.
        if (_userLibsCache.base) {
            return _userLibsCache.base;
        }
        _userLibsCache.base = libs[0].userLibs;
        return _userLibsCache.base;
    }
    static getLibRoot(id, version, base) {
        return new Promise((resolve, reject) => {
            // check cache
            const cache = _libRootCache;
            if (cache[base] && cache[base][id] && cache[base][id][version] !== undefined) {
                return resolve(cache[base][id][version] || '');
            }

            if (!cache[base]) {
                cache[base] = {};
            }

            if (!cache[base][id]) {
                cache[base][id] = {};
            }

            if (!cache[id]) {
                cache[id] = {};
            }
            let value = null;
            switch (id) {
                case 'xblox':
                    {
                        value = 'lib/xblox';
                        break;
                    }
                case 'dojo':
                    {
                        value = 'lib/dojo';
                        break;
                    }
                case 'maqetta':
                    {
                        value = 'lib/maqetta';
                        break;
                    }
                case 'delite':
                    {
                        value = 'lib/ibm-js/delite';
                        break;
                    }
                case 'deliteful':
                    {
                        value = 'lib/ibm-js/deliteful';
                        break;
                    }
                case 'requirejs':
                    {
                        value = 'lib/ibm-js/requirejs';
                        break;
                    }
                case 'user':
                    {
                        value = 'workspace_user/';
                        break;
                    }

            }
            cache[base][id][version] = value;
            return resolve(value || '');
        });
    }

    /*
     * JSON: [{id:'someLib', version'1.0', installed:'true', path:'/dojo'}]
     * installed and path may be left blank
     */
    getlibraryId(libraryName, version) {
        // hard coded for now, if version omitted return highest version ID for library
        const libs = {
            sketch: 'sketch',
            claro: 'claro'
        };
        return libs[libraryName] + (version || '');
    }

    getlibraryName(lib) {
        let libId;
        let libVersion;
        // tslint:disable-next-line:forin
        for (const name in lib) {
            libId = name;
            libVersion = lib[libId];
        }
        return libId;
    }
};
