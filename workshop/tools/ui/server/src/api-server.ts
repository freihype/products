import * as express from 'express';
import { Server } from 'typescript-rest';
import * as http from 'http';
import * as path from 'path';
import * as cors from 'cors';
import controllers from './controllers';
import { AddressInfo } from 'net';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { createProxyServer } from 'http-proxy';
import * as fs from 'fs';

const https = require('https');

const privateKey = fs.readFileSync('../certs/privkey1.pem', 'utf8');
const certificate = fs.readFileSync('../certs/cert1.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

import * as request from 'request';
export class ApiServer {

    private readonly app: express.Application;
    private server: http.Server = null;
    public PORT: number = +process.env.PORT || 3000;
    proxy: any;

    constructor() {
        this.app = express();
        this.config();

        const httpsServer = https.createServer(credentials, this.app);
        httpsServer.listen(8443);
        Server.useIoC();
        Server.buildServices(this.app, ...controllers);
        // TODO: enable for Swagger generation error
        // Server.loadServices(this.app, 'controllers/*', __dirname);
        Server.swagger(this.app, './dist/swagger.json', '/api-docs', 'localhost:3000', ['http']);
    }

    /**
     * Configure the express app.
     */
    private config(): void {
        this.app.use(cookieParser());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        this.app.use(bodyParser.text({
            verify: (req, res, buf, encoding) => {
                return true;
            },
            inflate: false
        }));

        this.app.use(bodyParser.json({
            verify: (req, res, buf, encoding) => {
                return true;
            },
            inflate: false
        }));

        this.app.use(bodyParser.raw({
            limit: '50mb',
            verify: (req, res, buf, encoding) => {
                return false;
            },
            // tslint:disable-next-line:object-literal-sort-keys
            inflate: false
        }));

        try {
            this.app.get('/resource', (req, res) => request({
                url: req.query.url,
                method: req.query.method,
                strictSSL: false,
                rejectUnauthorized: false
            }).pipe(res));
        } catch (e) {
            console.error('error resource proxy', e);
        }
        this.app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
        this.app.use(cors());
    }
    /**
     * Start the server
     * @returns {Promise<any>}
     */
    public start(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.server = this.app.listen(this.PORT, (err: any) => {
                if (err) {
                    return reject(err);
                }

                // TODO: replace with Morgan call
                // tslint:disable-next-line:no-console
                console.log(`Listening to http://${(this.server.address() as AddressInfo).address}:${((this.server.address() as AddressInfo).port)}`);

                return resolve();
            });
        });

    }

    /**
     * Stop the server (if running).
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.server) {
                this.server.close(() => {
                    return resolve(true);
                });
            } else {
                return resolve(true);
            }
        });
    }

}
