import {
    Column, Entity, PrimaryGeneratedColumn, ValueTransformer} from 'typeorm';
import { isString } from 'lodash';
export enum SessionStatus {
    STARTED = 'started',
    CLOSED = 'closed'
}

export const JSON_TRANSFORMER: ValueTransformer = {
    to(value: any): string {
        if (!isString(value)) {
            return JSON.stringify(value, null, 2);
        } else {
            return value;
        }
    },
    from(value: string): any {
        if (isString(value)) {
            return JSON.parse(value);
        }
        return value;
    }
};

@Entity()
export class Option {

    @PrimaryGeneratedColumn()
    // tslint:disable-next-line:variable-name
    option_id: number;

    @Column({ default: '' })
    // tslint:disable-next-line:variable-name
    option_name: string;

    @Column({
        type: 'text',
        nullable: true,
        default: ''
    })
    // tslint:disable-next-line:variable-name
    option_value: string;

}
