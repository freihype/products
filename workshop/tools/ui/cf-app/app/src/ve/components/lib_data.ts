export const libs = [{
    userLibs: [
        /*
        {
            "id": "dojo",
            "version": "1.8",
            "metaRoot": "app/metadata/dojo/1.8",
            "required": false,
            "hasSource": true,
            "root": ""
        },
        {
            "id": "DojoThemes",
            "version": "1.8",
            "metaRoot": "",
            "required": false,
            "hasSource": false,
            "root": "themes"
        },
        {
            "id": "gridx",
            "version": "1.0.0",
            "metaRoot": "app/metadata/gridx/1.0.0",
            "required": false,
            "hasSource": true,
            "root": "lib/dojo/gridx"
        },*/
        {
            id: 'html',
            version: '0.8',
            metaRoot: 'app/metadata/html/0.8',
            required: true,
            hasSource: false
        },
        /*,
                    {
                        "id": "requirejs",
                        "version": "0.8",
                        "metaRoot": "app/metadata/requirejs/",
                        "required": true,
                        "hasSource": false
                    },*/
        {
            id: 'delite',
            version: '0.8',
            metaRoot: 'app/metadata/delite/0.8',
            required: false,
            hasSource: true
        },
        /*,
                    {
                        "id": "clipart",
                        "version": "1.0",
                        "metaRoot": "app/metadata/clipart/1.0",
                        "required": false,
                        "hasSource": false,
                        "root": "lib/clipart"
                    },*/
        {
            id: 'xblox',
            version: '1.0',
            metaRoot: 'app/metadata/xblox/1.0',
            required: false,
            hasSource: false,
            root: 'lib/xblox'
        }
        /*,
                    {
                        "id": "user",
                        "version": "1.0",
                        "metaRoot": "workspace/metadata/",
                        "required": false,
                        "hasSource": false,
                        "root": "workspace",
                        getRoot:function(){
                            return require.toUrl('workspace');
                        },
                        getMetaPath:function(){
                            return 'metadata';
                        }
                    }
                    */
        /*
        {
            "id": "maqettaSamples",
            "version": "1.0",
            "metaRoot": "app/metadata/maqetta/core/0.3",
            "required": false,
            "hasSource": false,
            "root": "samples"
        },
        {
            "id": "maqetta",
            "version": "0.3",
            "metaRoot": "app/metadata/maqetta/core/0.3",
            "required": false,
            "hasSource": false,
            "root": "lib/maqetta"
        },
        {
            "id": "shapes",
            "version": "1.0",
            "metaRoot": "app/metadata/shapes/1.0",
            "required": false,
            "hasSource": false,
            "root": "lib/shapes"
        }*/
    ]
}];
export const themes = [{
        specVersion: '1.0',
        files: ['blackberry.css'],
        useBodyFontBackgroundClass: 'useBodyFontBg',
        helper: 'maq-metadata-dojo/dojox/mobile/ThemeHelper',
        themeEditorHtmls: ['../custom/dojo-theme-editor.html'],
        name: 'blackberry',
        path: ['project1/themes/blackberry/blackberry.theme'],
        base: '',
        className: 'blackberry',
        type: 'dojox.mobile',
        meta: ['../custom/custom.json'],
        version: '1.8'
    },
    {
        specVersion: '1.0',
        files: ['claro.css'],
        helper: 'maq-metadata-dojo/dijit/ThemeHelper',
        themeEditorHtmls: ['dojo-theme-editor.html'],
        name: 'claro',
        path: ['project1/themes/claro/claro.theme'],
        conditionalFiles: ['document.css'],
        className: 'claro',
        meta: ['claro.json'],
        version: '1.8'
    },
    {
        specVersion: '1.0',
        files: ['ipad.css'],
        useBodyFontBackgroundClass: 'useBodyFontBg',
        helper: 'maq-metadata-dojo/dojox/mobile/ThemeHelper',
        themeEditorHtmls: ['dojo-theme-editor.html'],
        name: 'ipad',
        path: ['project1/themes/ipad/ipad.theme'],
        base: '',
        className: 'ipad',
        type: 'dojox.mobile',
        meta: ['ipad.json'],
        version: '1.8'
    },
    {
        specVersion: '1.0',
        files: ['android.css'],
        useBodyFontBackgroundClass: 'useBodyFontBg',
        helper: 'maq-metadata-dojo/dojox/mobile/ThemeHelper',
        themeEditorHtmls: ['../custom/dojo-theme-editor.html'],
        name: 'android',
        path: ['project1/themes/android/android.theme'],
        base: '',
        className: 'android',
        type: 'dojox.mobile',
        meta: ['../custom/custom.json'],
        version: '1.8'
    },
    {
        specVersion: '1.0',
        files: ['custom.css'],
        useBodyFontBackgroundClass: 'useBodyFontBg',
        helper: 'maq-metadata-dojo/dojox/mobile/ThemeHelper',
        themeEditorHtmls: ['dojo-theme-editor.html'],
        name: 'custom',
        path: ['project1/themes/custom/custom.theme'],
        base: '',
        className: 'custom',
        type: 'dojox.mobile',
        meta: ['custom.json'],
        version: '1.8'
    },
    {
        specVersion: '1.0',
        files: ['iphone.css'],
        useBodyFontBackgroundClass: 'useBodyFontBg',
        helper: 'maq-metadata-dojo/dojox/mobile/ThemeHelper',
        themeEditorHtmls: ['../custom/dojo-theme-editor.html'],
        name: 'iphone',
        path: ['project1/themes/iphone/iphone.theme'],
        base: '',
        className: 'iphone',
        type: 'dojox.mobile',
        meta: ['../custom/custom.json'],
        version: '1.8'
    },
    {
        specVersion: '1.0',
        files: ['sketch.css'],
        themeEditorHtmls: ['../claro/dojo-theme-editor.html'],
        name: 'Sketch',
        path: ['project1/themes/sketch/sketch.theme'],
        className: 'claro',
        meta: ['../claro/claro.json'],
        version: '1.8'
    }
];
