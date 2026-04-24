import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';

@Entity({ name: 'venues' })
export class VenueOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'company_id' })
    companyId: string;

    @Column('varchar', { length: 200 })
    name: string;

    @Column('varchar', { name: 'address_line', length: 300 })
    addressLine: string;

    @Column('varchar', { length: 120 })
    city: string;

    @Column('varchar', { length: 120, nullable: true })
    region: string | null;

    @Column('varchar', { length: 3, default: 'CO' })
    country: string;

    @Column('double precision', { nullable: true })
    latitude: number | null;

    @Column('double precision', { nullable: true })
    longitude: number | null;

    @Column('integer', { nullable: true })
    capacity: number | null;

    @Column('text', { nullable: true })
    description: string | null;

    @Column('varchar', { name: 'image_url', length: 500, nullable: true })
    imageUrl: string | null;
}
