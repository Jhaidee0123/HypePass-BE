import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Base class for TypeORM entities.
 * Domain generates the UUID (see BaseEntity), so we use @PrimaryColumn instead
 * of @PrimaryGeneratedColumn — avoids surprise id rewrites on persist.
 */
export abstract class BaseOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
