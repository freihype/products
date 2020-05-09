module.exports = function (grunt) {
    var DIST_PLATFORM = grunt.option('DIST_PLATFORM');
    var OS = grunt.option('OS');
    var path = require('path');
    var os = require('os');
    var _ = require('lodash');
    var platforms = ['windows', 'linux_32', 'linux_64', 'osx', 'nodejs'];
    var _platforms = grunt.option('platforms');
    var DIST_PLATFORMS_PLATFORMS = ['windows', 'linux_32', 'linux_64', 'osx', 'nodejs'];
    if (_platforms) {
        if (_platforms.indexOf(',') !== -1) {
            DIST_PLATFORMS_PLATFORMS = _platforms.split(',');
        } else {
            DIST_PLATFORMS_PLATFORMS = [_platforms];
        }
    }

    var NODE_SERVER_ROOT = path.resolve('./server/nodejs');
    var SERVER_TEMPLATES = path.resolve('./server-template');
    var DIST_MAPPINGS = {
        'osx': '/Control-Freak.app/Resources/',
        'windows': '',
        'arm': '',
        'linux_32': '',
        'linux_64': '',
        'web': '',
        'nodejs': ''
    };
    var DIST_MAPPINGS_NODE_JS = {
        'osx': 'osx_64',
        'windows': 'windows',
        'arm': '',
        'linux_32': 'linux_32',
        'linux_64': 'linux_64',
        'web': ''
    };

    var DIST_MISC_MAPPINGS = {
        'web': 'dist/misc_web',
        'windows': 'dist/misc_windows',
        'linux_64': 'dist/misc_linux',
        'linux_32': 'dist/misc_linux',
        'nodejs': 'dist/misc_nodejs'
    };

    var DIST_ALL = path.resolve('./dist/all') + "/";

    function getMongoCopyTask(platform) {
        var OS_EXE_SUFFIX = platform === 'windows' ? '.exe' : '';
        return {
            src: path.resolve(SERVER_TEMPLATES + '/mongo/mongod-' + platform + OS_EXE_SUFFIX),
            dest: './dist/' + platform + DIST_MAPPINGS[platform] + '/mongo/mongod' + OS_EXE_SUFFIX
        };
    }

    function getNodeJSCopyTask(platform) {
        if (platform === 'web') {
            return {
                src: ['**'],
                dest: 'dist/' + platform + '/server/nodejs',
                cwd: './server/nodejs/dist/' + platform,
                expand: true,
                flatten: false
            };
        }
        if (platform === 'nodejs') {
            return {
                src: ['**'],
                dest: 'dist/' + platform + '/',
                cwd: './server/nodejs/dist/web/',
                expand: true,
                flatten: false
            };
        }
        return {
            src: ['**'],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/server/' + platform,
            cwd: './server/nodejs/dist/' + DIST_MAPPINGS_NODE_JS[platform],
            expand: true,
            flatten: false
        };
    }

    function getClientLibCopyTask(platform) {
        return {
            src: [
                'xblox/docs/**',
                'xtest/**',
                '!xcf/out/**',
                'external/**/*.css',
                'nls/**',
                'xcf/Header.javascript',
                'xcf/widgets/**/*.html',
                'xgrid/templateDIV.html',
                'xblox/model/code/RunScript.html',

                'xideve/component.js',
                'xideve/xblox/**',
                'xideve/xideve.js',
                'dojo/cldr/**',
                'dojo/resources/blank.gif',
                'xide/views/welcome.html',
                'xide/xide.js',
                'xide/build/**',
                'xide/utils.js',
                'util/touch.js',
                'xide/tests/TestUtils.js',
                'dojox/html/_base.js',
                'dojo/**/*.js',
                'xideve/delite/**',
                'xideve/metadata/**',
                'xide/widgets/ExpressionJavaScript.js',
                'xapp/*.js',
                'xlang/*.js',
                'xapp/**/*.*',
                'xibm/**/*.*',
                'xwire/build/**',
                'xfile/build/**',
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
                'xfile/newscene.html',
                '!xcf/out/**',
                '!build/**',
                '!external/selectize/node_modules/'
            ],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/Code/client/src/lib/',
            cwd: './Code/client/src/lib/',
            expand: true,
            flatten: false
        };
    }

    function getClientBuildCopyTask(platform) {
        return {
            src: [
                '**'
            ],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/Code/client/src/build/',
            cwd: './Code/client/src/build/',
            expand: true,
            flatten: false
        };
    }

    function getClientThemesCopyTask(platform) {
        return {
            src: [
                'html-transparent/dist/css/*.css',
                'html-white/dist/css/*.css',
                'html-gray/dist/css/*.css',
                'html-blue/dist/css/*.css',
                'html-transparent/dist/fonts/**',
                'html-white/dist/fonts/**',
                'html-gray/dist/fonts/**',
                'html-blue/dist/fonts/**'

            ],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/Code/client/src/theme/',
            expand: true,
            flatten: false,
            cwd: './Code/client/src/theme'
        };
    }

    function getDocumentationCopyTask(platform) {
        return {
            src: [
                '**'
            ],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/documentation/docFiles',
            expand: true,
            flatten: false,
            cwd: './documentation/docFiles'
        };
    }

    function getServerTemplateCopyTask(platform) {
        return {
            src: [
                '**'
            ],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/server-template',
            expand: true,
            flatten: false,
            cwd: './server-template'
        };
    }

    function getClientXCFCopyTask(platform) {
        return {
            src: ['**'],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/Code/client/src/xcf/',
            cwd: './Code/client/src/xcf',
            expand: true,
            flatten: false
        };
    }

    function getClientXFileCopyTask(platform) {
        return {
            src: ['**'],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/Code/client/src/xfile/',
            cwd: './Code/client/src/xfile',
            expand: true,
            flatten: false
        };
    }
    /**
     * needed to copy misc-web
     * @param platform
     * @returns {{src: string[], dest: string, cwd: *, expand: boolean, flatten: boolean}}
     */
    function getDistMiscCopyTask(platform) {
        if (DIST_MISC_MAPPINGS[platform]) {
            return {
                src: ['**'],
                dest: 'dist/' + platform + '/',
                cwd: DIST_MISC_MAPPINGS[platform],
                expand: true,
                flatten: false,
                dot: true
            };
        }
    }

    function getMiscCopyTask(platform) {
        return {
            src: ['**'],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/',
            cwd: './dist/misc',
            expand: true,
            flatten: false,
            dot: true
        };
    }

    function getSystemDataCopyTask(platform) {
        return {
            src: ['**'],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/data/',
            cwd: './data/',
            expand: true,
            flatten: false
        };
    }
    /**
     *
     * @param platform
     * @returns {{src: string[], dest: string, cwd: string, expand: boolean, flatten: boolean}}
     */
    function getExportCopyTask(platform) {
        return {
            src: ['**'],
            dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/export',
            cwd: './export',
            expand: true,
            flatten: false
        };
    }
    /**
     *
     */
    grunt.registerTask('build-client', "builds the client layers:\n" +
        "\t builds-xapp" +
        "\t builds-xfile-r" +
        "\t builds-xcf",
        function () {
            console.log('build client....'+process.cwd());
            var shell = {};
            var tasks = ['cd ./Code/client/',
                "sh buildclient.sh > buildReport_client_last.txt 2>&1"
            ];
            //grunt.option('buildXCF') !== false && tasks.push('cd src; sh buildxcf.sh > buildReport_xcf.txt 2>&1');

            shell['build_client'] = {
                command: tasks.join(' ; '),
                options: {
                    stderr: true
                }
            };
            grunt.extendConfig({
                shell: shell
            });

            grunt.task.run('shell:build_client');
        });


    /**
     *
     */
    grunt.registerTask('build-nodejs', "builds the server nodejs file:\n", function () {
        var shell = {};
        var tasks = ['cd ./Code/client/',
            "grunt build-xapp > buildReport_xapp.txt 2>&1",
            "grunt buildXFILE --package=xfile > buildReport_xfile.txt 2>&1"
        ];
        grunt.option('buildXCF') !== false && tasks.push('cd src; sh buildxcf.sh > buildReport_xcf.txt 2>&1');

        shell['build_client'] = {
            command: tasks.join(' && '),
            options: {
                stderr: true
            }
        };
        grunt.extendConfig({
            shell: shell
        });

        grunt.task.run('shell:build_client');
    });

    function processDevice(amdRequire, content, _path, type) {
        var utils = require(path.join(NODE_SERVER_ROOT, 'lib/build/utils/CIUtils.js'));
        var types = require(path.join(NODE_SERVER_ROOT, 'lib/build/types/Device.js'));
        var ENABLED = [
            "File-Server.meta.json",
            "VLC.meta.json"
        ];

        function find(_path) {
            for (var i = 0; i < ENABLED.length; i++) {
                var obj = ENABLED[i];
                if (_path.indexOf(obj) !== -1) {
                    return true;
                }
            }
            return false;
        }
        if (~_path.indexOf('.meta.json')) {
            var meta = JSON.parse(content);
            utils.setCIValue(meta, types.DEVICE_PROPERTY.CF_DEVICE_ENABLED, find(_path));
            content = JSON.stringify(meta, null, 2);
            return content;
        }
        return content;

    }
    var commit = grunt.option('commit');
    /**
     *
     */
    grunt.registerTask('update-dist', "update all distributions from source:\n" +
        "\tOptions:\n" +
        "\t--platforms=windows,linux_32,linux_64,osx_64,web,all : default\n" +
        "\t--libs=true|false	:	copy client libs\n" +
        "\t--php=true|false		:	copy php\n" +
        "\t--commit=true|false	:	commit the dist\n" +
        "\t--buildClient=true|false	:	build client files\n" +
        "\t\t   use buildXCF=false to prevent building the client" +
        "",
        function () {

            var buildClient = grunt.option('buildClient');
            if (buildClient) {
                grunt.task.run('build-client');
            }

            var libRoot = path.resolve('Code/client/src/lib/') + path.sep;

            //var amdRequire = require(path.resolve(NODE_SERVER_ROOT + '/dojo/dojo-require'))(path.resolve(libRoot),NODE_SERVER_ROOT,NODE_SERVER_ROOT);
            //const amdRequire = require((path.resolve(NODE_SERVER_ROOT + '/dojo/dojo-require'), !this.options.release ? '../dojo/dojo-require' : '/dojo/dojo-require'));
            var amdRequire = require(path.join(NODE_SERVER_ROOT, '/dojo/dojo-require'));
            amdRequire = amdRequire(path.resolve(libRoot), NODE_SERVER_ROOT);

            _.each(DIST_PLATFORMS_PLATFORMS, function (platform) {
                var copy = {};

                if (grunt.option('clean') === true) {
                    grunt.task.run('clean:dist-' + platform);
                }

                //////////////////////////////////////////////////////////
                //
                //	Export system scope data
                //
                copy = {};
                copy['dist-data_' + platform] = getSystemDataCopyTask(platform);
                if (copy['dist-data_' + platform]) {
                    grunt.extendConfig({
                        copy: copy
                    });
                    grunt.task.run('copy:dist-data_' + platform);
                }

                //////////////////////////////////////////////////////////
                //
                //	Built-In Drivers & Devices
                //
                var drivers = {
                    src: [
                        'Audio-Player/**',
                        'File-Server/**'
                    ],
                    dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/data/system/drivers/',
                    cwd: './user/drivers/',
                    expand: true,
                    flatten: false,
                    process: function (content, path) {
                        console.log('process ' + path);
                    }
                };
                var devices = {
                    src: [
                        'Audio-Player/**',
                        'File-Server/**'
                    ],
                    dest: 'dist/' + platform + DIST_MAPPINGS[platform] + '/data/system/devices/',
                    cwd: './user/devices/',
                    expand: true,
                    flatten: false,
                    options: {
                        process: function (content, path) {
                            return processDevice(amdRequire, content, path);
                        }
                    }
                };
                copy['dist-system_data_drivers' + platform] = drivers;
                copy['dist-system_data_devices' + platform] = devices;
                grunt.extendConfig({
                    copy: copy
                });
                grunt.task.run('copy:dist-system_data_drivers' + platform);
                grunt.task.run('copy:dist-system_data_devices' + platform);

                //////////////////////////////////////////////////////////
                //
                //	Client files direct from source
                //
                if (grunt.option('libs') !== false) {
                    copy = {};
                    copy['dist-client_src_lib_platform_' + platform] = getClientLibCopyTask(platform);
                    copy['dist-client_xcf_platform_' + platform] = getClientXCFCopyTask(platform);
                    copy['dist-client_xfile_platform_' + platform] = getClientXFileCopyTask(platform);
                    copy['dist-client_build_platform_' + platform] = getClientBuildCopyTask(platform);
                    copy['dist-client_theme_platform_' + platform] = getClientThemesCopyTask(platform);
                    grunt.extendConfig({
                        copy: copy
                    });
                    grunt.task.run('copy:dist-client_src_lib_platform_' + platform);
                    grunt.task.run('copy:dist-client_xcf_platform_' + platform);
                    grunt.task.run('copy:dist-client_xfile_platform_' + platform);
                    grunt.task.run('copy:dist-client_build_platform_' + platform);
                    grunt.task.run('copy:dist-client_theme_platform_' + platform);

                }
                copy = {};
                copy['dist-copy-documentation_' + platform] = getDocumentationCopyTask(platform);
                //copy['dist-copy-server-template_' + platform] = getServerTemplateCopyTask(platform);
                grunt.extendConfig({
                    copy: copy
                });
                grunt.task.run('copy:dist-copy-documentation_' + platform);
                //grunt.task.run('copy:dist-copy-server-template_' + platform);

                //////////////////////////////////////////////////////////
                //
                //	Misc files direct from source
                //
                copy = {};
                copy['dist-misc_platform_' + platform] = getMiscCopyTask(platform);
                grunt.extendConfig({
                    copy: copy
                });
                grunt.task.run('copy:dist-misc_platform_' + platform);


                //////////////////////////////////////////////////////////
                //
                //	Export Misc files direct from source
                //
                copy = {};
                copy['dist-export_platform_' + platform] = getExportCopyTask(platform);
                grunt.extendConfig({
                    copy: copy
                });
                grunt.task.run('copy:dist-export_platform_' + platform);

                //////////////////////////////////////////////////////////
                //
                //	Copy nodejs server
                //
                if (grunt.option('nodejs') !== false) {
                    copy = {};
                    copy['dist-nodejs_' + platform] = getNodeJSCopyTask(platform);
                    grunt.extendConfig({
                        copy: copy
                    });
                    grunt.task.run('copy:dist-nodejs_' + platform);
                }

                //////////////////////////////////////////////////////////
                //
                //	Copy nodejs server
                //
                /*
                if (grunt.option('mongo') !== false) {
                    copy = {};
                    copy['dist-mongo_' + platform] = getMongoCopyTask(platform);
                    grunt.extendConfig({ copy: copy });
                    grunt.task.run('copy:dist-mongo_' + platform);
                }
                */

                //////////////////////////////////////////////////////////
                //
                //	Export Dist Misc files direct from source
                //
                var _misccopy = {};
                _misccopy['dist-misc_misc_platform_' + platform] = getDistMiscCopyTask(platform);
                if (_misccopy['dist-misc_misc_platform_' + platform]) {
                    grunt.extendConfig({
                        copy: _misccopy
                    });
                    grunt.task.run('copy:dist-misc_misc_platform_' + platform);
                }

                if (platform === 'web') {
                    grunt.task.run('copy:dist-web-user');
                }
                //////////////////////////////////////////////////////////
                //
                //	Commit
                //
                //////////////////////////////////////////////////////////
                //
                //	Commit
                //
                if (grunt.option('commit') !== false) {
                    var shell = {};
                    shell['dist-commit_platform_' + platform] = {
                        command: [
                            "cd dist/" + platform,
                            "pwd;git add -A",
                            "gitc '" + (grunt.option('message') || 'latest') + "'"
                        ].join(';'),
                        options: {
                            stderr: true
                        }
                    };
                    grunt.extendConfig({
                        shell: shell
                    });
                    grunt.task.run('shell:dist-commit_platform_' + platform);
                }
            });
        });
};