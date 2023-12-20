import { Column, Entity, ManyToOne, Unique } from 'typeorm';

import { PrimaryId } from '../../types/id';
import { ProviderMetadata, Providers } from '../../types/login';
import BaseEntity from '../extends/baseEntity';
import User from './user';

@Entity()
@Unique(['provider', 'providerId'])
export default class Login extends BaseEntity {
    @Column()
    userId!: PrimaryId;

    @Column()
    provider!: Providers;

    @Column()
    providerId!: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: ProviderMetadata;

    /// Relationships
    @ManyToOne('User', 'logins', { onDelete: 'CASCADE' })
    user!: User;
}
