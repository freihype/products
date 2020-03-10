import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './Session';

@Entity()
export class SessionEvent {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    session: string;

    @Column()
    time: number;

    @Column()
    type: string;

    @Column()
    payload: string;
}
