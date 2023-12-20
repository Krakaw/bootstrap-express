import { Column, Entity, OneToMany } from 'typeorm';

import { UserRoles } from '../../types/user';
import BaseEntity from '../extends/baseEntity';
import type Login from './login';

@Entity()
export default class User extends BaseEntity {
    @Column({ default: UserRoles.User })
    role!: UserRoles;

    @OneToMany('Login', 'user', { onDelete: 'CASCADE' })
    logins!: Login[];
}
