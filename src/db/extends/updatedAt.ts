import { decorate } from 'ts-mixer';
import {
    BaseEntity,
    BeforeUpdate,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

export default abstract class CreatedUpdatedEntity extends BaseEntity {
    @decorate(BeforeUpdate())
    setUpdatedAt(): void {
        this.updatedAt = new Date();
    }

    @decorate(CreateDateColumn())
    createdAt!: Date;

    @decorate(UpdateDateColumn())
    updatedAt!: Date;
}
