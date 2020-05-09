/* jshint node:true */

module.exports = function (grunt) {

    var DIST_PLATFORM = grunt.option('DIST_PLATFORM');
    var OS = grunt.option('OS');
    var path = require('path');
    var net = require('net');
    var _ = require('lodash');
    var request = require('request');
    var SSH_OPTIONS = {
        host:'pearls-media.com',
        username: 'vu2003',
        port: '2222',
        password:'214,,asd'
        //privateKey: grunt.file.read("/home/mc007/.ssh/id_rsa")
    };

    var INSTALLER = {
        windows:{
            sftp: {
                files: {
                    "./": "/PMaster/projects/x4mm/dist/installer/Control-Freak_1.0.1.exe"
                },
                options: _.extend({
                    srcBasePath: '/PMaster/projects/x4mm/dist/installer/',
                    path: '/var/www/virtual/pearls-media.com/htdocs/control-freak/wp-content/uploads/downloads/',//on the host prefix
                    showProgress: true
                },SSH_OPTIONS)
            }
        },
        osx:{
            sftp: {
                files: {
                    "./": "/PMaster/projects/x4mm/dist/installer/Control-Freak_1.0.1.dmg"
                },
                options: _.extend({
                    srcBasePath: '/PMaster/projects/x4mm/dist/installer/',
                    path: '/var/www/virtual/pearls-media.com/htdocs/control-freak/wp-content/uploads/downloads/',//on the host prefix
                    showProgress: true
                },SSH_OPTIONS)
            }
        },
        linux_64:{
            sftp: {
                files: {
                    "./": "/PMaster/projects/x4mm/dist/installer/Control-Freak_linux_64.deb"
                },
                options: _.extend({
                    srcBasePath: '/PMaster/projects/x4mm/dist/installer/',
                    path: '/var/www/virtual/pearls-media.com/htdocs/control-freak/wp-content/uploads/downloads/',//on the host prefix
                    showProgress: true
                },SSH_OPTIONS)
            }
        },
        linux_32:{
            sftp: {
                files: {
                    "./": "/PMaster/projects/x4mm/dist/installer/Control-Freak_linux_32.deb"
                },
                options: _.extend({
                    srcBasePath: '/PMaster/projects/x4mm/dist/installer/',
                    path: '/var/www/virtual/pearls-media.com/htdocs/control-freak/wp-content/uploads/downloads/',//on the host prefix
                    showProgress: true
                },SSH_OPTIONS)
            }
        }
    };
    var ZIP = {
        windows:{
            sshexec: {
                command: [
                    'cd ./net-commander-site; sh windows.sh',
                    'ls'
                ],
                options: SSH_OPTIONS
            }
        },
        linux_32:{
            sshexec: {
                command: [
                    'cd ./net-commander-site; sh linux_32.sh',
                    'ls'
                ],
                options: SSH_OPTIONS
            }
        },
        linux_64:{
            sshexec: {
                command: [
                    'cd ./net-commander-site; sh linux_64.sh',
                    'ls'
                ],
                options: SSH_OPTIONS
            }
        },
        osx:{
            sshexec: {
                command: [
                    'cd ./net-commander-site; sh osx.sh',
                    'ls'
                ],
                options: SSH_OPTIONS
            }
        },
        web:{
            sshexec: {
                command: [
                    'cd ./net-commander-site; sh web.sh',
                    'ls'
                ],
                options: SSH_OPTIONS
            }
        }
    };
    
    grunt.registerTask('deploy-zip',"Creates zip file via SSH on server",function(){

        var platform = grunt.option('platform');
        /////////// Before Electron Build
        var settings = ZIP[platform];
        if(settings){
            if(settings.sshexec) {
                var sshexec = {};
                sshexec['INSTALLER_' + platform] = ZIP[platform].sshexec;
                grunt.extendConfig({sshexec: sshexec});
                grunt.task.run('sshexec:INSTALLER_' + platform);
            }
        }
    });

    grunt.registerTask('deploy-installer',"Deploys platform installer via SSH",function(){
        var platform = grunt.option('platform');
        /////////// Before Electron Build
        var settings = INSTALLER[platform];
        if(settings){
            if(settings.sftp) {
                var sftp = {};
                sftp['INSTALLER_' + platform] = INSTALLER[platform].sftp;
                grunt.extendConfig({sftp: sftp});
                grunt.task.run('sftp:INSTALLER_' + platform);
            }
        }
    });
};
