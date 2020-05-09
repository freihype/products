/* jshint node:true */
module.exports = function (grunt,repos) {


    var OS = grunt.option('OS');
    var path = require('path');
    var net = require('net');
    var os = require('os');
    var _ = require('lodash');

    //try get a user's module mapping
    var userModules = null;
    try {
        userModules = require(path.resolve('./module_map.js'));
    } catch (e) {
    }

    /**
     * Helper function to create a post task after git clone
     * @param directory
     * @param command
     * @returns {string}
     */
    function createPostTask(directory, command) {
        var shell = {};
        shell['post_install'] = {
            command: 'cd ' + directory + ';' + command,
            options: {
                stderr: false,
                stdout: false,
                stdin: false,
                failOnError: false,
                stdinRawMode: false,
                preferLocal: true
            }
        };
        grunt.extendConfig({shell: shell});
        return 'shell:post_install';
    }

    /**
     * Find a module config by path or name
     * @param path
     * @returns {object|null}
     */
    function getModuleConfig(path) {
        for (var i = 0; i < REPOSITORIES.length; i++) {
            var config = REPOSITORIES[i];
            if (config.options && (config.options.directory === path || config.name === path)) {
                return config;
            }
        }
        return null;
    }

    var REPOSITORIES = [
    ];

    /**
     * Function to print something through the task runner. We may use something else than grunt some day
     * @param msg {string} the message
     * */
    function verbose(msg) {
        grunt.log.verbose.writeln(msg);
    }

    /**
     * Helper function to add a new repo to our module list.
     * @param name {string} That is the unique name of the module.
     * @param rep {string} The repository url.
     * @param directory {null|string} The target directory to clone the module into.
     * @param gitOptions {null|object} A mixin to override default options for the module added.
     */
    function addRepository(name, rep, directory, gitOptions,options) {
        var userConfig = options || {};
        if (userModules) {
            var user = userModules.map(name, rep);
            if (user) {
                if (_.isString(user)) {
                    rep = user;
                } else if (_.isObject(user)) {
                    userConfig = user;
                }
            }
        }
        REPOSITORIES.push(_.extend({
            name: name,
            options: _.extend({
                repository: rep,
                directory: directory || name
            }, gitOptions || {})
        }, userConfig));
    }

    //var Package = require('../package.js');

    //Package.getModules(grunt,addRepository);

    grunt.registerTask('init-module', "Init a certain module. \n" +
        "Use --force to delete it before\n" +
        "Use --module to specify the module, eg: src/theme", function () {
        var force = grunt.option('force');
        var module = grunt.option('module');
        if (module) {
            module = getModuleConfig(module);
        } else {
            console.error('cant find module : ' + grunt.option('module'));
        }
        var config = module;
        var targetDirectory = path.resolve(config.options.directory);
        if (grunt.file.exists(targetDirectory)) {
            if (force === true) {
                grunt.file['delete'](targetDirectory);
            } else {
                verbose('Already checked out ' + config.name + ' from ' + config.options.repository);
                return;
            }
        }
        var gitClone = {};
        gitClone['clone_' + config.name] = {};
        gitClone['clone_' + config.name]['options'] = config.options;
        grunt.extendConfig({gitclone: gitClone});
        verbose('Checking out ' + config.name + ' from ' + config.options.repository);
        grunt.task.run('gitclone:' + 'clone_' + config.name);
        if (config.post && config.post.command) {
            verbose('Running post install ' + config.name + ' : ' + config.post.command);
            var task = createPostTask(targetDirectory, config.post.command);
            grunt.task.run(task);
        }
    });

    grunt.registerTask('init-modules', "Init sub modules. Use --force to delete them before", function () {
        var force = grunt.option('force');
        for (var i = 0; i < REPOSITORIES.length; i++) {
            var config = REPOSITORIES[i];
            var targetDirectory = path.resolve(config.options.directory);
            if (grunt.file.exists(targetDirectory)) {
                if (force === true) {
                    grunt.file['delete'](targetDirectory);
                } else {
                    verbose('Already checked out ' + config.name + ' from ' + config.options.repository);
                    continue;
                }
            }
            var gitClone = {};
            gitClone['clone_' + config.name] = {};
            gitClone['clone_' + config.name]['options'] = config.options;
            grunt.extendConfig({gitclone: gitClone});
            verbose('Checking out ' + config.name + ' from ' + config.options.repository);
            grunt.task.run('gitclone:' + 'clone_' + config.name);

            if (config.post && config.post.command) {
                verbose('Running post install ' + config.name + ' : ' + config.post.command);
                var task = createPostTask(targetDirectory, config.post.command);
                grunt.task.run(task);
            }
        }
    });

    grunt.registerTask('delete-modules', "Delete all modules", function () {
        for (var i = 0; i < REPOSITORIES.length; i++) {
            var config = REPOSITORIES[i];
            var targetDirectory = path.resolve(config.options.directory);
            if (!grunt.file.exists(targetDirectory)) {
                continue;
            }
            grunt.file['delete'](targetDirectory);
        }
    });

    grunt.registerTask('delete-module', "Delete a certain module by its path mapping, eg: src/theme", function () {
        var module = grunt.option('module');
        if (module) {
            module = getModuleConfig(module);
        } else {
            console.error('cant find module ' + module);
            return;
        }
        if (module) {
            var targetDirectory = path.resolve(module.options.directory);
            if (!grunt.file.exists(targetDirectory)) {
                console.error('directory doesnt exists ' + targetDirectory);
                return;
            }
            grunt.file['delete'](targetDirectory);
        }
    });

    grunt.registerTask('reset-module', "Resets a certain module by its path mapping, eg: src/theme", function () {
        var module = grunt.option('module');
        if (module) {
            module = getModuleConfig(module);
        } else {
            console.error('cant find module ' + module);
            return;
        }

        var targetDirectory = path.resolve(module.options.directory);
        if (!grunt.file.exists(targetDirectory)) {
            console.error('directory doesnt exists ' + targetDirectory);
            return;
        }
        var config = module;
        var gitReset = {};

        gitReset['reset_' + config.name] = {
            options: {
                cwd: targetDirectory
            },
            files: {
                src: '*'
            }
        };
        grunt.extendConfig({gitreset: gitReset});
        grunt.task.run('gitreset:' + 'reset_' + config.name);

    });

    function createCommitTask(name, message) {
        var module = getModuleConfig(name);
        if (!module) {
            console.error('cant find module ' + module);
            return;
        }

        var config = module;
        var targetDirectory = path.resolve(config.options.directory);

        grunt.registerTask('commit-module-' + name, "Commits changes in modules by its path mapping, eg: src/theme", function () {

            var message = grunt.option('message');
            if (!grunt.file.exists(targetDirectory)) {
                console.error('directory doesnt exists ' + targetDirectory);
                return;
            }
            var gitCommit = {};
            gitCommit['commit_' + config.name] = {
                options: {
                    cwd: targetDirectory,
                    message: message || "auto-commit",
                    verbose: false,
                    noVerify: true,
                    noStatus: false,
                    allowEmpty: false,
                    abort: false         //<-- i added this option in the grunt-git package
                },
                files: [
                    {
                        src: '.',
                        cwd: targetDirectory
                    }
                ]
            };

            grunt.extendConfig({gitcommit: gitCommit});
            grunt.task.run('gitcommit:commit_' + config.name);
        });

        grunt.registerTask('push-module-' + name, "Commits changes in modules by its path mapping, eg: src/theme", function () {
            var gitPush = {};
            gitPush['push_' + config.name] = {
                options: {
                    cwd: targetDirectory,
                    verbose: false
                }
            };
            grunt.extendConfig({gitpush: gitPush});
            grunt.task.run('gitpush:push_' + config.name);
        });
    }

    grunt.registerTask('commit-module', "Commits changes in modules by its path mapping, eg: src/theme", function () {
        var module = grunt.option('module');
        var message = grunt.option('message');
        if (module) {
            module = getModuleConfig(module);
        } else {
            console.error('cant find module ' + module);
            return;
        }

        var targetDirectory = path.resolve(module.options.directory);
        if (!grunt.file.exists(targetDirectory)) {
            console.error('directory doesnt exists ' + targetDirectory);
            return;
        }
        var config = module;
        var gitCommit = {};
        gitCommit['commit_' + config.name] = {
            options: {
                cwd: targetDirectory,
                message: message || "auto-commit",
                verbose: true,
                noVerify: true,
                noStatus: true,
                allowEmpty: false,
                abort: false
            },
            files: [
                {
                    src: '*',
                    cwd: targetDirectory
                }
            ]
        };
        grunt.extendConfig({gitcommit: gitCommit});
        grunt.task.run('gitcommit:' + 'commit_' + config.name);
        var gitPush = {};
        gitPush['push_' + config.name] = {
            options: {
                cwd: targetDirectory,
                verbose: true,
                force: true
            }
        };
        grunt.extendConfig({gitpush: gitPush});
        grunt.task.run('gitpush:' + 'push_' + config.name);
    });

    grunt.registerTask('commit-modules', "Commits changes in modules by its path mapping, eg: src/theme", function () {
        var message = grunt.option('message');
        for (var i = 0; i < REPOSITORIES.length; i++) {
            var config = REPOSITORIES[i];
            var repo = config.options.repository;
            if (repo.indexOf('xamiro') !== -1 || repo.indexOf('gbaumgart') !== -1) {
                createCommitTask(config.name);
                grunt.task.run('commit-module-' + config.name);
                grunt.task.run('push-module-' + config.name);
            }
        }
    });
};
