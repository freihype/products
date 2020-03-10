import {
    Column, Entity, OneToMany, PrimaryGeneratedColumn, ValueTransformer, IsNull
} from 'typeorm';
import { SessionEvent } from './SessionEvent';
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
export class Session {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: '' })
    session: string;

    @Column({ default: '' })
    visit: string;

    @Column({ default: '' })
    referer: string;

    @Column({ default: '' })
    tags: string;

    @Column({
        type: 'text', default: '[]',
        transformer: JSON_TRANSFORMER,
        nullable: true
    })
    events: string;

    @Column({ default: SessionStatus.STARTED })
    status: string;

}
