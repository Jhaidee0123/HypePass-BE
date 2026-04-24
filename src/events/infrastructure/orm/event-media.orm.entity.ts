import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { EventMediaType } from '../../domain/types/event-media-type';

@Entity({ name: 'event_media' })
export class EventMediaOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'event_id' })
    eventId: string;

    @Column('varchar', { length: 500 })
    url: string;

    @Column('varchar', { name: 'public_id', length: 200, nullable: true })
    publicId: string | null;

    @Column({ type: 'varchar', length: 20, default: EventMediaType.GALLERY })
    type: EventMediaType;

    @Column('integer', { name: 'sort_order', default: 0 })
    sortOrder: number;

    @Column('varchar', { length: 200, nullable: true })
    alt: string | null;
}
