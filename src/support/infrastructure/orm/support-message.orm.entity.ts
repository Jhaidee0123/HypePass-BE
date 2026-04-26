import { Column, Entity, Index } from 'typeorm';
import { BaseOrmEntity } from '../../../shared/infrastructure/orm/base.orm-entity';
import { SupportMessageAuthorKind } from '../../domain/types/support.types';

@Entity({ name: 'support_messages' })
export class SupportMessageOrmEntity extends BaseOrmEntity {
    @Index()
    @Column('uuid', { name: 'ticket_id' })
    ticketId: string;

    @Column({ type: 'varchar', length: 10, name: 'author_kind' })
    authorKind: SupportMessageAuthorKind;

    @Column('text', { name: 'author_user_id', nullable: true })
    authorUserId: string | null;

    @Column('text')
    body: string;

    @Column({ type: 'text', name: 'attachments', array: true, nullable: true })
    attachments: string[] | null;
}
