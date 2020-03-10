import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column('text')
    text: string;
}
