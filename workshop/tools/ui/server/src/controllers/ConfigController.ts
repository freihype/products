import { Request } from 'express';
import { Inject } from 'typescript-ioc';
import { ContextRequest, GET, Path, PathParam, POST, QueryParam } from 'typescript-rest';
import { Repo } from '../database/Repository';
import * as log from '../log';
import { SessionRepo } from './SessionRepo';
import { Option } from '../entities/Option';

@Path('/config')
export class ConfigController extends SessionRepo {
    @Inject
    connection: Repo;

    public async getOption(name: string): Promise<Option> {
        const repo = await this.connection.getRepository(Option);
        if (!repo) {
            console.error('no repo!');
            return null;
        }

        let option = await repo.findOne({ option_name: name });
        if (!option) {
            option = new Option();
            option.option_name = name;
            await repo.save(option);
        }
        return option;
    }

    @Path('save/')
    @POST
    async save(@ContextRequest request: Request) {
        const repo = await this.connection.getRepository(Option);
        const option: Option = await this.getOption('srOptions');
        option.option_value = JSON.stringify(request.body, null, 2);
        log.inspect('save options : ', request.body);
        repo.save(option);
        return true;
    }

    @Path('get')
    @GET
    async get() {
        const config = await this.getOption('srOptions');
        if (config) {
            return config.option_value;
        }
        return null;
    }
}
