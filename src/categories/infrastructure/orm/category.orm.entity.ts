import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

@Entity({ name: 'event_categories' })
export class CategoryOrmEntity extends BaseOrmEntity {
    @Column('varchar', { length: 120 })
    name: string;

    @Index({ unique: true })
    @Column('varchar', { length: 120 })
    slug: string;

    @Column('varchar', { length: 40, nullable: true })
    icon: string | null;

    @Column('integer', { name: 'sort_order', default: 0 })
    sortOrder: number;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;
}
