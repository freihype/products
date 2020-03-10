import { Connection, ObjectType, EntitySchema, Repository } from 'typeorm';
import { getConnection } from './Connection';

export class Repo {
    connection: Connection;
    async getRepository<Entity>(target: ObjectType<Entity> | EntitySchema<Entity> | string): Promise<Repository<Entity>> {
        const connection = await getConnection();
        return connection.getRepository(target);
    }
}
