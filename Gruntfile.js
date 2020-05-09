/*global module */
module.exports = function (grunt) {
    function log(err, stdout, stderr, cb) {
        console.log(arguments);
        cb();
    }
    var path = require('path');
    var os = require('os');
    var arch = os.arch();
    var is32 = arch!=='x64';
    var is64 = arch==='x64';
    
    var os_suffix='Linux';
    
    var clientDirectory = path.resolve('./client/');
    var libDirectory = path.resolve('./client/src/lib');

    var distAllDirectory = path.resolve('./dist/all/Code');
    var libsBuildDirectory = path.resolve(libDirectory +'/build');
    var ROOT = path.resolve('./');
    var DIST_FINAL = path.resolve(ROOT +'/dist/'+ OS) + path.sep;//windows default

    var DIST_WEB = path.resolve(ROOT +'/dist/web') + path.sep;

    var DIST_WINDOWS = path.resolve(ROOT +'/dist/windows') + path.sep;
    var DIST_LINUX_32 = path.resolve(ROOT +'/dist/linux_32') + path.sep;
    var DIST_LINUX_64 = path.resolve(ROOT +'/dist/linux_64') + path.sep;

    var DIST_DEVICE_SERVER_ROOT = path.resolve(ROOT +'/server/nodejs/dist') + path.sep;//windows default
    var USER = path.resolve(ROOT +'/user') + path.sep;

    var platform = os.platform();
    if(platform ==='win32'){
        os_suffix = 'windows';
    }else if(platform ==='darwin'){
        os_suffix = 'osx';
    }else if(platform ==='linux' && os.arch()=='arm'){
        os_suffix = 'arm';
    }else if(platform ==='linux'){
        if(is32) {
            os_suffix = "linux_32";
        }else if(is64){
            os_suffix = "linux_64";
        }
    }
    var OS = os_suffix.toLowerCase();
    grunt.option('OS',OS);
    grunt.option('os_suffix',os_suffix);
    var NODE_SERVER_ROOT = path.resolve('./server/nodejs');
    var libRoot =path.resolve('Code/client/src/lib/') + path.sep;
    var amdRequire = require(path.resolve(NODE_SERVER_ROOT + '/dojo/dojo-require'))(path.resolve(libRoot),NODE_SERVER_ROOT,NODE_SERVER_ROOT);
    function processDevice(amdRequire,content,path,type){
        var Commons = amdRequire('nxapp/Commons');
        var FileUtils = amdRequire('nxapp/utils/FileUtils');

        var utils = Commons.utils;
        var types = Commons.types;
        var ENABLED = [
            "File-Server.meta.json",
            "VLC.meta.json"
        ];
        function find(_path){
            for (var i = 0; i < ENABLED.length; i++) {
                var obj = ENABLED[i];
                if(_path.indexOf(obj)!==-1){
                    return true;
                }
            }
            return false;
        }
        if (path.indexOf('.meta.json') !==-1) {
            var meta = JSON.parse(content);
            utils.setCIValue(meta,types.DEVICE_PROPERTY.CF_DEVICE_ENABLED,find(path));
            content = JSON.stringify(meta,null,2);
            return content;
        }
        return content;

    }
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        parallel: {
            stream: {
                options: {
                    stream: true
                },
                tasks: [ { cmd: 'tail', args: ['-f', '/var/log/syslog'] }]
            },
            electron: {
                options: {
                    stream: false
                },
                tasks: [
                    {
                        cmd: 'build/electron-template/start.sh',
                        args: []
                    }
                ]

            },
            "electron-test": {
                options: {
                    stream: false
                },
                tasks: [
                    {
                        cmd: 'build/electron-template/start.sh',
                        args: []
                    }
                ]

            },
            all: {
                options: {
                    stream: true
                },
                tasks:[
                    {
                        cmd: 'Code/client/src/theme/update-dark.sh',
                        args: []
                    },
                    {
                        cmd: 'Code/client/src/theme/update-white.sh',
                        args: []
                    },
                    {
                        cmd: 'Code/client/src/theme/update-blue.sh',
                        args: []
                    },
                    {
                        cmd: 'Code/client/src/theme/update-gray.sh',
                        args: []
                    },
                    {
                        cmd: 'Code/client/watch.sh',
                        args: [

                        ]
                    }
                ]
            },
            all2: {
                options: {
                    stream: true
                },
                tasks:[
                    {
                        cmd: 'server/nodejs/start.sh',
                        args: []
                    },
                    {
                        cmd: 'server/nodejs/dev.sh',
                        args: []
                    }
                ]
            }

        },
        sshexec: {
            "update-docs": {
                command: [
                    'cd ./htdocs/Control-Freak-Documentation;git pull',
                    'ls'
                ],
                options: {
                    host: 'ss1',
                    username: '_2012',
                    password:'214,,asd'
                }
            },
            electron: {
                command: [
                    'build.bat'
                ],
                options: {
                    host: '192.168.1.99',

                    username: 'Admin',
                    password:'admin',
                    debug: console.log,
                    readyTimeout:99999,
                    ignoreErrors:false
                }
            },
            "electron-copy": {
                command: [
                    'copy.bat'
                ],
                options: {
                    host: '192.168.1.99',
                    username: 'Admin',
                    password:'admin',
                    debug: console.log,
                    readyTimeout:99999,
                    ignoreErrors:false
                }
            }
        },
        nginx: {
            options: {
                config: 'build/www-server-template/nginx/conf/nginx_linux.conf',
                prefix: 'build/www-server-template/nginx',
                useSudo:true
            }
        },        
        shell: {
            'kill-php':{
                command: [
                    "killall -q -9 php-cgi || true",
                    "(killall -q -9 nginx || true)"
                ].join(' && '),
                options: {
                    stderr: true
                }
            },
            'commit-windows':{
                command: [
                    "cd dist/windows",
                    "git add -A ./",
                    "git commit -m='update' &> /dev/null",
                    "git push -q &> /dev/null"
                ].join(' && '),
                options: {
                    stderr: true
                }
            },
            'commit-docs-pre':{
                command: [
                    "cd Control-Freak-Documentation",
                    "rm -rf modules"
                ].join(' && '),
                options: {
                    stderr: true
                }
            },
            'commit-docs-after':{
                command: [
                    "cd Control-Freak-Documentation",
                    "git add -A modules",
                    "gitc"
                ].join(' && '),
                options: {
                    stderr: true
                }
            },
            commit: {
                command: [
                    "gitcs",
                    "cd client",
                    "gitcs"
                ].join('&&'),
                options: {
                    stderr: true
                }
            },
            jsdoc: {
                command: [
                    "cd Code/client/src/lib ",
                    " sh updateDocs.sh "
                ].join('&&'),
                options: {
                    stderr: true
                }
            },
            phpfm: {
                command: [
                    "killall -q -9 php-cgi || true",
                    "php-cgi -b 127.0.0.1:9000 &"
                ].join('&&'),
                options: {
                    stderr: false,
                    execOptions: {
                        cwd: 'docs'
                    }
                }
            },
            electron: {
                command: [
                    "pwd " +
                    "cd ./build/electron-template",
                    "npm start"
                ].join('&&'),
                options: {
                    stderr: false,
                    execOptions: {
                        cwd: 'docs'
                    }
                }
            },
            themes: {
                command: [
                    'cd Code/client/src/theme',
                    'grunt --gruntfile GruntfileDark.js --target=html-transparent dist-compass'
                ].join('&&'),

                options: {
                    stderr: false

                }
            },
            dijit: {
                command: [
                    'cd Code/client/src/',
                    'sh updateDijit.sh'
                ].join('&&'),

                options: {
                    stderr: true

                }
            },
            themewhite: {
                command: [
                    'cd Code/client/src/theme',
                    'ls',
                    'grunt --gruntfile GruntfileDark.js --target=html-white dist-compass'
                ].join('&&'),

                options: {
                    stderr: false

                }
            },
            themex: {
                command: [
                    'cd Code/client/src/css/commons',
                    'compass compile'
                ].join('&&'),

                options: {
                    stderr: false

                }
            },
            server: {
                command: [
                    'sh updateServer.sh'
                ].join('&&'),

                options: {
                    stderr: true,
                    failOnError:false
                }
            },
            deviceServer: {
                command: [
                    'cd Code/utils',
                    'ls',
                    //'forever -s stop nxappmain/server.js',
                    'forever start nxappmain/server.js'
                ].join('&&'),

                options: {
                    stderr: true,
                    failOnError:false,
                    cwd:'Code/utils'
                }
            }
        },
        copy:{
            "dist-workspace":{
                src:[
                    '**'
                ],
                dest:'./dist/all/data/workspace',
                expand: true,
                flatten: false,
                cwd:'./data/workspace'
            },
            "dist-web":{
                src:[
                    '**'
                ],
                dest:DIST_WEB,
                expand: true,
                flatten: false,
                cwd:'./dist/all',
                filter:function(what){
                    return what.indexOf('all/server') == -1;
                }
            },
            "dist-web-device-server":{
                src:[
                    '**'
                ],
                dest:DIST_WEB + 'server/nodejs/',
                expand: true,
                flatten: false,
                cwd:DIST_DEVICE_SERVER_ROOT + '/web/'
            },
            "dist-web-misc":{
                src:[
                    '**'
                ],
                dest:DIST_WEB,
                expand: true,
                flatten: false,
                cwd:ROOT + '/dist/misc'
            },
            "dist-web-misc-misc":{
                src:[
                    '**'
                ],
                dest:DIST_WEB,
                expand: true,
                flatten: false,
                cwd:ROOT + '/dist/misc_web'
            },
            "dist-web-user":{
                src:[
                    '**',
                    '!**/node_modules/**'

                ],
                dest:DIST_WEB + 'user/',
                expand: true,
                flatten: false,
                cwd:USER,
                noProcess: [
                    '**/*.{png,gif,jpg,ico,psd,ttf,otf,woff,svg}'
                ],
                filter:function(what){
                    return what.indexOf('claycenter') == -1;
                },
                options: {
                    encoding:null,
                    process: function (content, path) {
                        if(path.indexOf('.json')!==-1) {
                            return processDevice(amdRequire, content, path);
                        }
                        return content;
                    }
                }

            },
            "xcf-api-docs":{
                src:[
                    '**'
                ],
                dest:'./Control-Freak-Documentation/modules/xcfnode/out',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/lib/out'
            },
            "server-template":{
                src:[
                    '**/**',
                    '!php/**'
                ],
                dest:'./dist/all/server-template/',
                expand: true,
                flatten: false,
                cwd:'./server-template/'
            },
            "node-servers":{
                src:[
                    'windows/**',
                    'linux_32/**',
                    'linux_64/**',
                    'osx_64/**',
                    'arm/**'
                ],
                dest:'./dist/all/server/',
                expand: true,
                flatten: false,
                cwd:'./server/nodejs/dist'
            },
            "export-template":{
                src:[
                    '**/**'
                ],
                dest:'./dist/all/export',
                expand: true,
                flatten: false,
                cwd:'./export'
            },
            "dist-data":{
                src:[
                    'data/**'
                ],
                dest:'./dist/all',
                expand: true,
                flatten: false,
                cwd:'./'
            },
            "dist-client":{
                src:[
                    '**'
                ],
                dest:'./dist/all/Code/client/src/xfile/ext',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/xfile/ext'
            },
            "dist-client-ext":{
                src:[
                    '**'
                ],
                dest:'./dist/all/Code/client/src/xcf/ext',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/xcf/ext'
            },
            "dist-xcf":{
                src:[
                    '**'
                ],
                dest:'./dist/all/Code/client/src/xcf',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/xcf',
                filter:function(what){
                    if(what.indexOf('xcf_d')!==-1){
                        return false;
                    }
                    return true;
                }
            },
            "dist-xapp":{
                src:[
                    '**',
                    '!**/commander/plugins/LESS',
                    '!**/commander/plugins/HTMLEditor',
                    '!**/commander/plugins/Markdown',
                    '!**/commander/plugins/ImageEdit',
                    '!**/commander/plugins/Sandbox',
                    '!**/commander/plugins/Share',
                    '!**/commander/plugins/SVN',
                    '!**/commander/plugins/Zoho'
                    //'!**/commander/plugins'
                ],
                dest:'./dist/all/Code/xapp',
                expand: true,
                flatten: false,
                cwd:'./Code/xapp',
                filter:function(what){
                    if(what.indexOf('node_modules')!==-1||
                        what.indexOf('tests')!==-1||
                        what.indexOf('testing')!==-1||
                        what.indexOf('/test')!==-1 ||
                        what.indexOf('/plugins/Markdown')!==-1||
                        what.indexOf('/plugins/ImageEdit')!==-1){
                        return false;
                    }
                    return true;
                }
            },
            "xcf-client":{
                src:[
                    'xcf/run-release.js',
                    'xblox/docs/**',
                    'xtest/**',
                    '!xcf/out/**',
                    'external/**/*.css',
                    'xide/layout/**',
                    'nls/**',
                    'dijit/dijitb.js',
                    'xide/views/**',
                    'xlang/**',
                    'xcf/Header.javascript',
                    'xcf/widgets/templates/**',
                    'xcf/widgets/**',
                    'xide/json/**',
                    'xide/widgets/**',
                    'xide/xide.js',
                    'xcf/widgets/**',
                    'xide/tests/TestUtils.js',
                    'xgrid/templateDIV.html',
                    'xblox/model/code/RunScript.html',
                    'xide/views/welcome.html',
                    'xideve/component.js',
                    'xideve/xblox/**',
                    'xideve/xideve.js',
                    'dgrid/util/touch.js',
                    'davinci/actions/nls/**',
                    'davinci/nls/**',
                    'davinci/ui/nls/**',
                    'davinci/ve/nls/**',
                    'davinci/ve/resources/**',

                    'davinci/workbench/nls/**',

                    'dijit/form/nls/**',
                    'dijit/nls/**',
                    'dojox/form/nls/**',
                    'dojox/widget/**',
                    'dojo/**',
                    'dstore/**',
                    'xfile/manager/FileManager.js',
                    'xfile/types.js',
                    'xfile/manager/FileManagerActions.js',
                    'xaction/src/types.js',
                    'xnode/manager/NodeServiceManager.js',
                    'xideve/delite/**',
                    'xideve/metadata/**',

                    'dojo/resources/blank.gif',


                    'dojox/html/**',
                    
                    'xblox/build/**',
                    'xcf/build/**',
                    'xdojo/**',
                    'xapp/*.js',
                    'xapp/build/**',
                    'xapp/build/boot.js',
                    'xapp/build/bootr.js',
                    'xibm/ibm/Font-Awesome/css/**',
                    'xibm/ibm/requirejs-domready/domReady.js',
                    'xibm/ibm/Font-Awesome/fonts/**',
                    'xibm/ibm/delite/themes/**',
                    'xibm/ibm/dojo/**',
                    '!xibm/ibm/dojo/tests/**',
                    '!xibm/ibm/dojo/testsDOH/**',
                    'xibm/ibm/lodash-compat/main.js',
                    'xibm/ibm/requirejs/require.js',
                    'xibm/ibm/themes/**',
                    'xibm/ibm/main_build.css',
                    'xibm/xibm/delite/**',
                    'xibm/xibm/deliteful/**',
                    'xide/build/**',
                    'xide/utils.js',
                    'xwire/build/**',
                    'xfile/build/**',
                    'dijit/**/*.html',
                    'dijit/themes/**/**.css',
                    'davinci/**/*.html',
                    'dojox/**/*.html',
                    'external/lodash.min.js',
                    'external/jquery-1.9.1.min.js',
                    'external/sockjs-0.3.min.js',


                    '!xide/tests/data/**',
                    '!xide/tests/intern/**',
                    '!external/jsPanel',
                    '!xace/ace/**',
                    '!xace/aceBuild/**',
                    '!xace/docs/**',
                    '!xide/node_modules/**',
                    '!xcf/node_modules/**',
                    '!xblox/node_modules/**',
                    '!xide/out/**',
                    '!xcf/out/**',
                    '!build/**'

                ],
                dest:'./dist/all/Code/client/src/lib/',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/lib/',
                filter:function(what){
                    if(what.indexOf('node_modules')!==-1){
                        return false;
                    }
                    what.replace('Code/client/src/lib/','');
                    return true;
                }
            },
            "css":{
                src:[
                    'css/**',
                    '!**/*.less',
                    '!**/*.scss'
                ],
                dest:'./dist/all/Code/client/src/',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/',
                filter:function(what){
                    if(what.indexOf('.sass-cache')!==-1){
                        return false;
                    }
                    return true;
                }

            },
            "themes":{
                src:[
                    'html-transparent/dist/css/*.css',
                    'html-white/dist/css/*.css',
                    'html-gray/dist/css/*.css',
                    'html-blue/dist/css/*.css'
                ],
                dest:'./dist/all/Code/client/src/theme',
                expand: true,
                flatten: false,
                cwd:'./Code/client/src/theme'

            }

        },
        clean:{
            dist:[
                'dist/all/Code/**','dist/all/data/**'
            ],
            'dist-web':[
                DIST_WEB + '/*',
                "!" + DIST_WEB +'.git',
                "!" + DIST_WEB +'CHANGELOG.md',
                "!" + DIST_WEB +'.gitattributes'
            ],
            'dist-windows':[
                DIST_WINDOWS + '/*',
                "!" + DIST_WINDOWS +'.git',
                "!" + DIST_WINDOWS +'CHANGELOG.md',
                "!" + DIST_WINDOWS +'.gitattributes'
            ],
            'dist-linux_32':[
                DIST_LINUX_32 + '/*',
                "!" + DIST_LINUX_32 +'.git',
                "!" + DIST_LINUX_32 +'CHANGELOG.md',
                "!" + DIST_LINUX_32 +'.gitattributes'
            ],
            'dist-linux_64':[
                DIST_LINUX_64 + '/*',
                "!" + DIST_LINUX_64 +'.git',
                "!" + DIST_LINUX_64 +'CHANGELOG.md',
                "!" + DIST_LINUX_64 +'.gitattributes'
            ]
        }

    });


    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-ssh');
    grunt.loadNpmTasks('grunt-parallel');
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-extend-config");
    grunt.loadNpmTasks('grunt-git');
    var modules = require(path.resolve('./tasks/modules'))(grunt,[2,2]);
    grunt.loadTasks('tasks');


    // Aliases
    //grunt.registerTask("css", ["less", "cssToJs"]);
    grunt.registerTask("jsdoc", "jsdoc-amddcl");
    grunt.registerTask('test', [ 'intern:local' ]);
    grunt.registerTask('themes', ['shell:themes','shell:dijit','shell:themewhite','shell:themex']);
    grunt.registerTask('services', [
        'shell:deviceServer',
        'shell:xide'
    ]);

    grunt.registerTask('watch-themes', [
        'parallel:themes'

    ]);

    grunt.registerTask('start', [
        'parallel:all'
    ]);
    grunt.registerTask('start2', [
        'parallel:all2'
    ]);
    grunt.registerTask('dist-client', [
        'copy:xcf-client',
        'copy:dist-xcf',
        'copy:themes',
        'copy:dist-client'
    ]);
    grunt.registerTask('dist-data', [
        'copy:dist-workspace',
        'copy:dist-data'
    ]);
    grunt.registerTask('dist-prepare', [
        'clean:dist',
        'dist-client',
        'dist-data',
        'dist-node',
        'copy:server-template'
    ]);

    grunt.registerTask('dist-prepare', [
        'dist-data',
        'dist-node',
        'copy:server-template'
    ]);

    grunt.registerTask('web', "do web dist",function(){
        grunt.task.run('clean:dist-web');
        grunt.task.run('copy:dist-web');
        grunt.task.run('copy:dist-web-device-server');
        grunt.task.run('copy:dist-web-user');
        grunt.task.run('copy:dist-web-misc');
        grunt.task.run('copy:dist-web-misc-misc');

    });

    grunt.registerTask('dist-node', [
        'copy:node-servers',
        'copy:export-template'
    ]);

    grunt.registerTask('electron', [
        'parallel:electron'
    ]);

    grunt.registerTask('update-windows', [
        'dist-prepare',
        'sshexec:electron',
        'sshexec:electron-copy'
    ]);

    grunt.registerTask('update-docs', [
        'shell:jsdoc',
        'shell:commit-docs-pre',
        'copy:xcf-api-docs',
        'shell:commit-docs-after',
        'sshexec:update-docs'
    ]);
};