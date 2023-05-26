import { decorate } from 'ts-mixer';
import { PrimaryGeneratedColumn } from 'typeorm';

import UpdatedAt from './updatedAt';

export default abstract class BaseEntity extends UpdatedAt {
    @decorate(PrimaryGeneratedColumn('uuid'))
    id!: string;
}
