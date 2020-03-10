import { Connection, ConnectionOptions, createConnection, getConnectionOptions } from 'typeorm';
import { Post } from '../entities/Post';
import { Session } from '../entities/Session';
import { SessionEvent } from '../entities/SessionEvent';
import { Option } from '../entities/Option';
let connection: Connection;

export async function getConnection() {

    if (connection) {
        return connection;
    }
    const conop: ConnectionOptions = await getConnectionOptions();

    connection = await createConnection({
        ...conop,
        ...{
            entities: [
                `${__dirname}` + '/src/entities/*.{js,ts}',
                Post,
                Option,
                Session,
                SessionEvent
            ]
        }
    });
    return connection;
}
