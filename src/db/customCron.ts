import { Column, Entity } from 'typeorm';

import { CustomCronMetadata, CustomCronType } from '../types/customCron';
import BaseEntity from './extends/baseEntity';

@Entity({ name: 'custom_crons' })
export default class CustomCron extends BaseEntity {
    @Column()
    name!: string;

    @Column()
    cron!: string;

    @Column({ default: true })
    active!: boolean;

    @Column({
        type: 'enum',
        enum: CustomCronType
    })
    type!: CustomCronType;

    @Column({ nullable: true })
    lastRunAt?: Date;

    @Column({ nullable: true })
    lastFinishedAt?: Date;

    @Column({ nullable: true, type: 'jsonb' })
    metadata?: CustomCronMetadata;
}
