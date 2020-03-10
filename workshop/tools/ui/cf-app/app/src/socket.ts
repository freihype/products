import { connect as io } from 'socket.io-client';
import { COMMANDS, debug } from './shared';
import { after, before, around, SIGNALS } from './shared/AspectDecorator';
import { resolve } from 'path';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';

export class Socket {
    private static socket: SocketIOClient.Socket | undefined;
    constructor(private url: string = 'http://localhost:3010') {

    }
    private init() {
        if (!Socket.socket) {
            Socket.socket = io(this.url);
        }

        return Socket.socket;
    }

    public socket(): SocketIOClient.Socket { return Socket.socket as SocketIOClient.Socket };

    public on(key: string, handler: any) {
        return this.init().on(key, (data) => {
            handler.apply(this, [data]);
        });
    }
    public emit(key: string, data: any) {
        return this.init().emit(key, data);
    }
    public off(key: string, handler: any) {
        return this.init().off(key, handler);
    }

    tasks: any = {}
    public ask(key: string, data: any) {
        return new Promise<any>((resolve, reject) => {
            const socket = this.init();
            console.log('ask ws ' + key);
            const id = v4();
            socket.once(key, (res) => {
                delete this.tasks[id];
                resolve(res.response);
            });
            socket.emit(key, {
                data: data,
                id: id
            });
            // track
            this.tasks[id] = {
                id,
                data
            }
        });
    }

    private subscribe() {
        const socket = this.init();
        if (socket['_subscribed']) {
            return
        }
        socket['_subscribed'] = true;
        return this;
        /*
        socket.on('events', (data) => {
            console.log('event', data);
        });
        socket.on('message', (data) => {
            console.log('message', data);
        });
        */
    }
    public async connect() {
        return new Promise<SocketIOClient.Socket>((resolve, reject) => {
            const socket = this.init();
            this.subscribe();
            resolve(socket);
        });
    }
}
