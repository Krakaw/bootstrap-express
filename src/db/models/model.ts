import { BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class Model {
    @BeforeUpdate()
    setUpdatedAt(): void {
        this.updatedAt = new Date();
    }

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: () => 'NOW()' })
    createdAt!: Date;

    @Column({ default: () => 'NOW()' })
    updatedAt!: Date;
}
