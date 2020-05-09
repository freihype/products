/* jshint node:true */

module.exports = function (grunt) {

    var DIST_PLATFORM = grunt.option('DIST_PLATFORM');
    var OS = grunt.option('OS');
    var path = require('path');
    var net = require('net');
    var os = require('os');
    var _child = require('child_process');
    var _ = require('lodash');
    var request = require('request');
    var platforms = ['windows', 'linux_32', 'linux_64', 'osx'];
    var _platforms = grunt.option('platforms');
    var tcpPortUsed = require('tcp-port-used');
    var DIST_PLATFORMS_PLATFORMS = ['windows', 'linux_32', 'linux_64', 'osx', 'web'];
    if (_platforms) {
        if (_platforms.indexOf(',') !== -1) {
            DIST_PLATFORMS_PLATFORMS = _platforms.split(',');
        } else {
            DIST_PLATFORMS_PLATFORMS = [_platforms];
        }
    }



    var DIST_MAPPINGS = {
        'osx':'/Control-Freak/Resources/',
        'windows':'',
        'arm':'',
        'linux_32':'',
        'linux_64':''
    };

    var NODE_JS_ROOT = path.resolve('server/nodejs/dist') + "/";

    var PLATFORM_VMS = {
        windows:{
            host:'windows',
            vmx:'/windows10/Windows 10 x64.vmx'
        },
        osx:{
            host:'osx',
            vmx:'/mnt/anne/vmware/osx/OS X El Capitan.vmx'
        },
        linux_32:{
            host:'linux_32',
            vmx:'/mnt/anne/vmware/ubuntu_32/Ubuntu/Ubuntu.vmx'
        }
    };

    var Promise = require('grunt-promise').using('bluebird');

    var PLATFORM_SSH = {        
        windows:{
            buildElectron:'build.bat',
            buildServer:'buildServer.bat',
            buildInstaller:'buildInstaller.bat',
            options:{
                host: 'windows',
                username: 'mc007',
                password:'asdasd',
                ignoreErrors:true,
                suppressRemoteErrors:true
            }
        },
        linux_64:{
            buildElectron:'cd /PMaster/projects/x4mm/build/electron-template; grunt platform --platform=linux_64',
            buildServer:'source /etc/profile;cd /PMaster/projects/x4mm/server/nodejs/dist/linux_64; rm -rf node_modules;npm install > /dev/null 2>&1;cd ../../;grunt clean-platform --platform=linux_64',
            buildInstaller:'cd /PMaster/projects/x4mm/; grunt update-dist --platforms=linux_64  --commit=false ; cp -rf ./dist/linux_64/* ./build/electron-template/tmplinux_64/Control-Freak/opt/Control-Freak/ ; cd /PMaster/projects/x4mm/build/electron-template;grunt createInstaller --platform=linux_64',
            options:{
                host: 'localhost',
                username: 'mc007',
                password:'213,,asd',
                ignoreErrors:true,
                suppressRemoteErrors:true
            }
        },
        linux_32:{
            buildElectron:'cd /mnt/hgfs/PMaster/projects/x4mm/build/electron-template; grunt platform --platform=linux_32',
            buildServer:'cd /PMaster/projects/x4mm/server/nodejs/dist/linux_32; npm3 install > /dev/null 2>&1',
            buildInstaller:'cd /mnt/hgfs/PMaster/projects/x4mm/; cd /mnt/hgfs/PMaster/projects/x4mm/build/electron-template; grunt createInstaller --platform=linux_32 -v --stack',
            options:{
                host: 'linux_32',
                username: 'mc007',
                password:'asdasd',
                ignoreErrors:true,
                suppressRemoteErrors:true
            }
        },
        osx:{
            buildElectron:'sh build.sh',
            buildServer:'sh buildServer.sh',
            buildInstaller:'sh buildInstaller.sh',
            wait:60,
            options:{
                host: 'osx',
                username: 'admin',
                password:'123',
                ignoreErrors:true,
                suppressRemoteErrors:true
            }
        },
        arm:{
            buildElectron:'sh build.sh',
            buildServer:'source /etc/profile;cd /install/xDojoWatch;git reset --hard origin;gitus;cd dist/arm; rm -rf node_modules; npm3 install > /dev/null 2>&1;cd ../../;grunt clean-platform --platform=arm;gitc',
            buildInstaller:'sh buildInstaller.sh',
            wait:60,
            options:{
                host: 'pi',
                username: 'pi',
                password:'asdasd',
                ignoreErrors:true,
                suppressRemoteErrors:true
            }
        }
    };

    var ELECTRON_BEFORE = {
        windows:{
            command: "grunt clean:dist-windows;"
        },
        linux_32:{
            command: "rm -rf build/electron-template/tmplinux_32"
        },
        linux_64:{
            command: "rm -rf build/electron-template/tmplinux_64"
        },
        osx:{
            command: "rm -rf dist/osx/*"
        }
    };

    var ELECTRON_AFTER = {
        windows:{
            command: "grunt update-dist --buildClient=false --platforms=windows --php=false --commit=false ;"
        },
        linux_32:{
            command: "grunt update-dist --buildClient=false --platforms=linux_32 --php=false --commit=false; cp -rf ./build/electron-template/tmplinux_32/Control-Freak/opt/Control-Freak/* ./dist/linux_32/"
        },
        linux_64:{
            command: "grunt clean:dist-linux_64; cp -rf ./build/electron-template/tmplinux_64/Control-Freak/opt/Control-Freak/* ./dist/linux_64/"
        },
        osx:{
            command: "grunt update-dist --buildClient=false --platforms=osx --php=false --commit=false"
        }
    };


    var SERVER_BEFORE = {
        windows:{
            command: "cd server/nodejs/dist/windows; rm -rf node_modules"
        },
        osx:{
            command: "cd server/nodejs/dist/osx_64; rm -rf node_modules"
        },
        linux_32:{
            command: "cd server/nodejs/dist/linux_32; rm -rf node_modules"
        },
        linux_64:{
            command: "cd server/nodejs/dist/linux_64; rm -rf node_modules"
        }
    };

    var SERVER_AFTER = {
        windows:{
            command: [
                "cd server/nodejs; grunt clean-platform --platform=windows",
                "cd dist/windows ",
                "git add -A . > /dev/null 2>&1; gitc > /dev/null 2>&1 ",
                "rm -rf ../../../../dist/windows/server/windows/* ",
                "mkdir -p ../../../../dist/windows/server/windows ",
                "cp -rf ./ ../../../../dist/windows/server/windows/"
            ].join(' ; ')
        },
        osx:{
            command: [
                "cd server/nodejs; grunt clean-platform --platform=osx_64;cd dist/osx_64",
                "git add -A . > /dev/null 2>&1; gitc > /dev/null 2>&1",
                "rm -rf ../../../../dist/all/server/osx_64/*",
                "cp -rf ./ ../../../../dist/all/server/osx_64/"].join(' ; ')
        },
        linux_64:{
            command: [
                "cd /PMaster/projects/x4mm/server/nodejs/dist/linux_64",
                "git add -A . > /dev/null 2>&1; gitc > /dev/null 2>&1"
            ].join(' ; ')
        },
        linux_32:{
            command: [
                "cd /PMaster/projects/x4mm/server/nodejs/; grunt clean-platform --platform=linux_32 ",
                "cd dist/linux_32 ; git add -A . > /dev/null 2>&1; gitc > /dev/null 2>&1 "            ].join(' ; ')
        },
        arm:{
            command:""
        }
    };

    var INSTALLER_AFTER = {
        windows:{
            command: ""
        },
        osx:{
            command: "sh commitOSX.sh"
        }
    };

    console.log('update platforms : ' + DIST_PLATFORMS_PLATFORMS.join('  '));

    var DIST_ALL = path.resolve('./dist/all') + "/";

    //////////////////////////////////////////////////////////
    //
    //	SUB - TASKS
    //
    grunt.registerTask('build-client',"builds the client layers:\n" +
        "\t builds-xapp" +
        "\t builds-xfile-r" +
        "\t builds-xcf",function(){

        var shell = {};
        var tasks = ['cd ./Code/client/',
            "grunt build-xapp > buildReport_xapp.txt 2>&1",
            "grunt buildXFILE --package=xfile > buildReport_xfile.txt 2>&1"
        ];
        grunt.option('buildXCF')!==false && tasks.push('cd src; sh buildxcf.sh > buildReport_xcf.txt 2>&1');
        shell['build_client'] = {
            command: tasks.join(' ; '),
            options: {
                stderr: true
            }
        };
        grunt.extendConfig({shell: shell});

        grunt.task.run('shell:build_client');
    });


    function createVMBuildTask(platform,command){
        grunt.registerTask('build-vm'+platform,"fires up virtual machine, calls done as soon host can be connected via ssh port 22",function() {
            console.log('run  '+command + ' on ' + platform);
            //var done = this.async();
            if (!PLATFORM_SSH[platform]) {
                console.error('have no ssh config for '+platform);
                return null;
            }
            var ssh = {};

            var tasks = [command];
            ssh['build-vm_'+platform] = {
                command: tasks,
                options:PLATFORM_SSH[platform].options
            };
            grunt.extendConfig({sshexec: ssh});
            grunt.task.run('sshexec:build-vm_'+platform);
            //done();
        });
        return 'build-vm'+platform;
    }

    function createVMBuildTaskAsync(platform,command){
        //var res = grunt.registerPromise('build-vm'+platform,function() {
            return new Promise(function (resolve) {
                console.log('run  '+command + ' on ' + platform);
                //var done = this.async();
                if (!PLATFORM_SSH[platform]) {
                    console.error('have no ssh config for '+platform);
                    return null;
                }
                var ssh = {};
                var tasks = [command];
                ssh['build-vm_'+platform] = {
                    command: tasks,
                    options:PLATFORM_SSH[platform].options
                };
                grunt.extendConfig({sshexec: ssh});
                grunt.task.run('sshexec:build-vm_'+platform);
                resolve('Hello World!');

            });
            //done();
        //});
        //console.log('----',res);
        //return res;
    }

    function createVMStopTask(platform){

        grunt.registerTask('_stop-vm_'+platform,"fires up virtual machine, calls done as soon host can be connected via ssh port 22",function() {

            if (!PLATFORM_VMS[platform]) {
                console.error('have no vmx config for '+platform);
                return null;
            }

            var config = PLATFORM_VMS[platform];

            var vmx = config.vmx;
            var host = config.host;
            var tasks = 'vmrun -T ws stop "' + vmx + '" ';
            var done = this.async();
            var isConnected = false;

            function off() {
                if (isConnected) {
                    isConnected = true;
                }
                isConnected = true;
                console.info('host is down ' + host + ' @ ' + vmx);
                setTimeout(function(){
                    done();
                },6000);
            }

            function startPinging() {
                tcpPortUsed.waitUntilFreeOnHost(22, host, 500, 10000)
                    .then(function () {
                        off();
                    }, function (err) {
                        off();
                    });
            }
            startPinging();

            _child.exec(tasks, function (e) {
                startPinging();
            });
        });
    }

    function createVMStartTask(platform){

        grunt.registerTask('_start-vm_'+platform,"fires up virtual machine, calls done as soon host can be connected via ssh port 22",function() {
            if (!PLATFORM_VMS[platform]) {
                console.error('have no vmx config for '+platform);
                return null;
            }

            var config = PLATFORM_VMS[platform];


            var vmx = config.vmx;
            var host = config.host;
            var tasks = 'vmrun -T ws start "' + vmx + '" ';
            var done = this.async();
            var isConnected = false;

            function connected() {
                if (isConnected) {
                    return;
                }
                isConnected = true;
                console.info('host is up ' + host + ' @ ' + vmx);
                done();
            }

            function startPinging() {
                tcpPortUsed.waitUntilUsedOnHost(22, host, 500, 30000)
                    .then(function () {
                        connected();
                    }, function (err) {
                        console.log('host connect error, trying again....', err.message);
                        startPinging();
                    });
            }
            startPinging();
            _child.exec(tasks, function (e) {
                startPinging();
            });
        });        
        return '_start-vm_'+platform;
        
    }

    grunt.registerTask('start-vm',"fires up virtual machine, calls done as soon host can be connected via ssh port 22",function(){
        var platform = grunt.option('platform');

        console.log('start vm '+ platform);
        return grunt.task.run(createVMStartTask(platform));
    });

    grunt.registerTask('stop-vm',"shuts down virtual machine, calls done as soon host cant be connected via ssh port 22",function(){
        var platform = grunt.option('platform');
        createVMStopTask(platform);
        grunt.task.run('_stop-vm_'+platform);

    });
    //
    //	SUB - TASKS  - END
    //
    //////////////////////////////////////////////////////////

    
    grunt.registerTask('build-platform-electron',"Builds the platform electron, using VM and/or SSH",function(){
        var platform = grunt.option('platform');
        /////////// Before Electron Build
        if(ELECTRON_BEFORE[platform]){
            var shell = {};
            shell['ELECTRON_BEFORE_' + platform] = ELECTRON_BEFORE[platform];
            grunt.extendConfig({shell:shell});
            console.log('build-electron_before',shell);
            grunt.task.run('shell:ELECTRON_BEFORE_' + platform);
        }
        /////////// Do Electron Build
        grunt.task.run('start-vm');
        if(PLATFORM_SSH[platform]) {
            grunt.task.run(createVMBuildTask(platform, PLATFORM_SSH[platform].buildElectron));
        }
        /////////// After Electron Build
        if(ELECTRON_AFTER[platform]){
            var shell = {};
            shell['ELECTRON_AFTER_' + platform] =ELECTRON_AFTER[platform];
            grunt.extendConfig({shell:shell});
            console.log('build-electron_after',shell);
            grunt.task.run('shell:ELECTRON_AFTER_' + platform);
        }

        grunt.option('stop')!==false && grunt.task.run('stop-vm');
    });

    grunt.registerTask('build-platform-installer',"builds",function(){
        var platform = grunt.option('platform');
        grunt.task.run('start-vm');

        if(PLATFORM_SSH[platform]) {
            grunt.task.run(createVMBuildTask(platform, PLATFORM_SSH[platform].buildInstaller));
        }
        if(INSTALLER_AFTER[platform]){
            var shell = {};
            shell['INSTALLER_AFTER_' + platform] = INSTALLER_AFTER[platform];
            grunt.extendConfig({shell:shell});
            grunt.task.run('shell:INSTALLER_AFTER_' + platform);
        }
        grunt.option('stop')!==false && grunt.task.run('stop-vm');
    });

    grunt.registerTask('clean-platform-servers',"builds",function(){

        var plaforms = ['windows','linux_32','linux_64','arm'];

        _.each(platforms,function(platform){

            var platformPath = path.resolve(DIST_ALL+'/server/'+platform);

            console.log('clean platforms : '+platformPath);

            var clean = {};
            clean['clean_server_'+platform] =[
                platformPath + '/node_modules/**/*.pdb',
                platformPath + '/node_modules/firmata/node_modules',
                platformPath + '/node_modules/serialport/node_modules',
                platformPath + '/node_modules/johnny-five/node_modules',
                platformPath + '/node_modules/**/*.obj',
                platformPath + '/node_modules/**/*.lib',
                platformPath + '/node_modules/**/*.exp',
                platformPath + '/node_modules/**/MAKEFILE',
                platformPath + '/node_modules/**/Makefile',
                platformPath + '/node_modules/**/Cakefile',
                platformPath + '/node_modules/**/Gruntfile.js',
                platformPath + '/node_modules/**/Vagrantfile',
                platformPath + '/node_modules/**/.tern-port',
                platformPath + '/node_modules/**/*.cc',
                platformPath + '/node_modules/**/*.c',
                platformPath + '/node_modules/**/*.s', //asm
                platformPath + '/node_modules/**/*.S', //asm
                platformPath + '/node_modules/**/*.py',
                platformPath + '/node_modules/**/*.pyc',
                platformPath + '/node_modules/**/*.pl',
                platformPath + '/node_modules/**/*.rb',
                platformPath + '/node_modules/**/*.tlog',
                platformPath + '/node_modules/**/*.sln',
                platformPath + '/node_modules/**/.jshintrc',
                platformPath + '/node_modules/**/.lint',
                platformPath + '/node_modules/**/jsl.node.conf',
                platformPath + '/node_modules/**/.eslintrc',
                platformPath + '/node_modules/**/.editorconfig',
                platformPath + '/node_modules/**/.jscs.json',
                platformPath + '/node_modules/**/.npmignore',
                platformPath + '/node_modules/**/.eslintignore',
                platformPath + '/node_modules/**/*.dntrc',
                platformPath + '/node_modules/**/*.cpp',
                platformPath + '/node_modules/**/*.jpg',
                platformPath + '/node_modules/**/*.png',
                platformPath + '/node_modules/**/.gitmodules',
                platformPath + '/node_modules/**/*.h',
                platformPath + '/node_modules/**/*.patch',
                platformPath + '/node_modules/**/_test',
                platformPath + '/node_modules/**/LICENSE',
                platformPath + '/node_modules/**/*LICENSE*',
                platformPath + '/node_modules/**/*LICENCE*',
                platformPath + '/node_modules/**/License',
                platformPath + '/node_modules/**/license',
                //platformPath + '/node_modules/**/*test.js*',
                //platformPath + '/node_modules/**/*-test.js*',
                platformPath + '/node_modules/**/AUTHORS',
                platformPath + '/node_modules/**/LICENSE.txt',
                platformPath + '/node_modules/**/MIT-LICENSE.txt',
                platformPath + '/node_modules/**/README',
                platformPath + '/node_modules/**/README.md',
                platformPath + '/node_modules/**/usage.txt',
                platformPath + '/node_modules/**/*.md',
                platformPath + '/node_modules/**/*.txt',
                platformPath + '/node_modules/**/*.markdown',
                platformPath + '/node_modules/**/Changelog',
                platformPath + '/node_modules/**/CHANGES',
                platformPath + '/node_modules/**/CHANGELOG',
                platformPath + '/node_modules/**/.travis.yml',
                platformPath + '/node_modules/**/appveyor.yml',
                platformPath + '/node_modules/**/robot.html',
                platformPath + '/node_modules/**/examples',
                platformPath + '/node_modules/**/example',
                platformPath + '/node_modules/**/example.js',
                platformPath + '/node_modules/**/screenshots',
                platformPath + '/node_modules/**/.gitattributes',
                platformPath + '/node_modules/**/benchmarks',
                platformPath + '/node_modules/**/*benchmark*',
                platformPath + '/node_modules/**/coverage',
                platformPath + '/node_modules/**/docs',
                platformPath + '/node_modules/**/*.coffee',
                platformPath + '/node_modules/**/tests',
                platformPath + '/node_modules/**/*.vcxproj',
                platformPath + '/node_modules/**/*.vcxproj.filters',
                platformPath + '/node_modules/**/node-pre-gyp',
                platformPath + '/node_modules/**/node-gyp',
                platformPath + '/node_modules/**/gyp',
                platformPath + '/node_modules/**/*.gypi'
            ];
            grunt.extendConfig({
                clean: clean
            });
            grunt.task.run('clean:clean_server_'+platform);
        });
    });

    grunt.registerTask('build-platform-server',"builds",function(){
        var PLATFORMS = [].concat(DIST_PLATFORMS_PLATFORMS);
        var _platform = grunt.option('platform');
        if(_platform && _platform.length){
            PLATFORMS = [_platform];
        }

        var _platforms = grunt.option('platforms');
        if(_platforms && _platforms.length){
            PLATFORMS = _platforms.split(',') || [_platforms];
        }
        if(!PLATFORMS || !PLATFORMS.length){
            console.error('build-platform-server : have no platforms! platform arg ' + _platform);
            return;
        }

        var shell = {};
        for(var i = 0 ; i < PLATFORMS.length ; i++){
            var platform = PLATFORMS[i];
            /////////// Before Server Build
            if (SERVER_BEFORE[platform]) {
                shell = {};
                shell['SERVER_BEFORE_' + platform] = SERVER_BEFORE[platform];
                grunt.extendConfig({shell: shell});
                grunt.task.run('shell:SERVER_BEFORE_' + platform);
            }


            /////////// Do Server Build
            if(grunt.option('buildModules')!==false) {
                if(PLATFORM_VMS[platform]){
                    grunt.task.run('start-vm');
                }

                /*
                var vmCMD = createVMBuildTaskAsync(platform, PLATFORM_SSH[platform].buildServer).then(function(){
                    console.log('done');
                });
                */

                //var vmCMD = createVMBuildTask(platform, PLATFORM_SSH[platform].buildServer);
                if(PLATFORM_SSH[platform]) {
                    grunt.task.run(createVMBuildTask(platform, PLATFORM_SSH[platform].buildServer));
                }else{
                    console.error('have no config for '+platform);
                }

                //console.log('run vm build tasks '+ vmCMD,_res);
            }


            /////////// After Build
            if (SERVER_AFTER[platform]) {
                shell = {};
                shell['SERVER_AFTER_' + platform] = SERVER_AFTER[platform];
                grunt.extendConfig({shell: shell});
                grunt.task.run('shell:SERVER_AFTER_' + platform);
            }

            if (PLATFORM_VMS[platform]) {
                grunt.option('stop') !== false && grunt.task.run('stop-vm');
            }



            var SERVER_BIN = path.resolve(NODE_JS_ROOT + path.sep + platform + path.sep +'server');
            var SERVER_MODULES = path.resolve(NODE_JS_ROOT + path.sep + platform + path.sep +'node_modules');


            if(!grunt.file.exists(SERVER_MODULES)){
                //grunt.fail.warn('Building Server Modules failed: '+SERVER_MODULES +' doesnt exists', 2);
            }

            if(!grunt.file.exists(path.resolve(SERVER_MODULES + path.sep + 'vlc-ffi'))){
                //grunt.fail.warn('Building Server Modules failed: '+SERVER_MODULES +' doesnt exists', 2);
            }
            /////////// Check Build
        }

    });
    
    grunt.registerTask('build-nodejs',"builds the server nodejs file:\n",function(){
        var shell = {};
        var tasks = ['cd ./Code/client/',
            "grunt build-xapp > buildReport_xapp.txt 2>&1",
            "grunt buildXFILE --package=xfile > buildReport_xfile.txt 2>&1"
        ];
        grunt.option('buildXCF')!==false && tasks.push('cd src; sh buildxcf.sh > buildReport_xcf.txt 2>&1');
        shell['build_client'] = {
            command: tasks.join(' ; '),
            options: {
                stderr: true
            }
        };
        grunt.extendConfig({shell: shell});
        grunt.task.run('shell:build_client');
    });

    grunt.registerTask('build-nxapp',"builds the server nodejs file:\n",function(){

        var shell = {};
        var tasks = ['cd ./server/nodejs/',
            "grunt platform --nexe=false > buildReport_nxapp.txt 2>&1"
        ];

        shell['build_nxapp'] = {
            command: tasks.join(' ; '),
            options: {
                stderr: true
            }
        };

        var tasksCopy = [
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/windows/server/windows/nxappmain/serverbuild.js',
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/web/server/nodejs/nxappmain/serverbuild.js',
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/linux_32/server/linux_32/nxappmain/serverbuild.js',
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/linux_64/server/linux_64/nxappmain/serverbuild.js',

            'cp ./server/nodejs/dist/all/package.json ./dist/windows/server/windows/package.json',
            'cp ./server/nodejs/dist/all/package.json ./dist/web/server/nodejs/package.json',
            'cp ./server/nodejs/dist/all/package.json ./dist/linux_32/server/linux_32/package.json',
            'cp ./server/nodejs/dist/all/package.json ./dist/linux_64/server/linux_64/package.json'
        ];
        shell['nxapp_copy'] = {
            command: tasksCopy.join(';'),
            options: {
                stderr: true
            }
        };

        grunt.extendConfig({shell: shell});
        grunt.task.run('shell:build_nxapp');
        grunt.task.run('shell:nxapp_copy');
    });

    grunt.registerTask('copy-nxapp',"copies the server nodejs file:\n",function(){

        var shell = {};

        var tasksCopy = [
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/windows/server/windows/nxappmain/serverbuild.js',
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/web/server/nodejs/nxappmain/serverbuild.js',
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/linux_32/server/linux_32/nxappmain/serverbuild.js',
            'cp ./server/nodejs/dist/all/nxappmain/serverbuild.js ./dist/linux_64/server/linux_64/nxappmain/serverbuild.js',

            'cp ./server/nodejs/dist/all/package.json ./dist/windows/server/windows/package.json',
            'cp ./server/nodejs/dist/all/package.json ./dist/web/server/nodejs/package.json',
            'cp ./server/nodejs/dist/all/package.json ./dist/linux_32/server/linux_32/package.json',
            'cp ./server/nodejs/dist/all/package.json ./dist/linux_64/server/linux_64/package.json'
        ];
        shell['nxapp_copy'] = {
            command: tasksCopy.join(';'),
            options: {
                stderr: true
            }
        };

        grunt.extendConfig({shell: shell});
        grunt.task.run('shell:nxapp_copy');
    });



    grunt.registerTask('update-platforms', "build update all distributions from source:\n" +
        "\tOptions:\n" +
        "\t--platforms=windows,linux_32,linux_64,osx_64,web,all : default\n" +
        "\t--libs=true|false	:	copy client libs\n" +
        "\t--commit=true|false	:	commit the dist\n" +
        "\t--server=true|false	:	build server modules\n" +
        "\t--build=true|false	:	build client files\n" +
        "\t--nxapp=true|false	:	build server nxapp file\n" +
        "\t\t   use buildXCF=false to prevent building the client" +
        "", function () {

        var _platform = grunt.option('platform');
        if(_platform){
            DIST_PLATFORMS_PLATFORMS = [_platform];
        }
        if (grunt.option('nxapp') === true) {
            grunt.task.run('build-nxapp');
        }

        if (grunt.option('build') !== false) {
            grunt.option('commit',false);
            grunt.option('buildClient',true);
            grunt.option('buildClient_',true);
            grunt.task.run('update-dist');
        }

        grunt.task.run('copy-nxapp');

        for(var i = 0 ; i < DIST_PLATFORMS_PLATFORMS.length ; i++){
            var platform = DIST_PLATFORMS_PLATFORMS[i];
            grunt.option('platform',platform);
            grunt.option('stop',false);

            if (grunt.option('server') !== false) {
                grunt.task.run('build-platform-server');
            }

            if (grunt.option('installer') !== false) {
                grunt.option('electron',true);
            }
            if (grunt.option('electron') !== false) {
                grunt.task.run('build-platform-electron');
            }

            if (grunt.option('installer') !== false) {
                grunt.task.run('build-platform-installer');
            }

            if (grunt.option('commitDist') !== false) {
                grunt.option('commit',true);
                //grunt.option('php',false);
                grunt.option('buildClient',false);
            }

            if (grunt.option('deploy') !== false) {
                grunt.task.run('deploy-installer');
                grunt.task.run('deploy-zip');
            }
        }
    });

};
