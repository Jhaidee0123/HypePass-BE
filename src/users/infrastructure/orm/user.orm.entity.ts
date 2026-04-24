import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Maps the `user` table owned by Better Auth.
 * We mark it `synchronize: false` because Better Auth manages the schema.
 * Column names follow Better Auth's camelCase convention (its default).
 */
@Entity({ name: 'user', synchronize: false })
export class UserOrmEntity {
    @PrimaryColumn('text')
    id: string;

    @Column('text')
    email: string;

    @Column('text')
    name: string;

    @Column({ type: 'boolean', name: 'emailVerified', default: false })
    emailVerified: boolean;

    @Column({ type: 'text', nullable: true })
    image: string | null;

    @Column({ type: 'text', default: 'user' })
    role: string;

    @Column({ type: 'boolean', nullable: true })
    banned: boolean | null;

    @Column({ type: 'text', name: 'banReason', nullable: true })
    banReason: string | null;

    @Column({ type: 'timestamptz', name: 'banExpires', nullable: true })
    banExpires: Date | null;

    @Column({ type: 'text', name: 'phoneNumber', nullable: true })
    phoneNumber: string | null;

    @Column({ type: 'timestamptz', name: 'createdAt' })
    createdAt: Date;

    @Column({ type: 'timestamptz', name: 'updatedAt' })
    updatedAt: Date;
}
