import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { NotFoundDomainException } from '../../../../shared/infrastructure/filters/domain.exception';
import { AuditLogService } from '../../../../audit/application/services/audit-log.service';
import { IEventRepository } from '../../../domain/repositories/event.repository';
import { TicketOrmEntity } from '../../../../tickets/infrastructure/orm/ticket.orm.entity';
import { TicketQrTokenOrmEntity } from '../../../../tickets/infrastructure/orm/ticket-qr-token.orm.entity';

/**
 * Admin emergency: rotate QR generation version for every ticket of an event,
 * invalidating every live token. Any QR rendered before this call will be
 * rejected as STALE_TOKEN on check-in. Use when tokens have been leaked or
 * scraped.
 */
export class RotateEventQrUseCase {
    private readonly logger = new Logger(RotateEventQrUseCase.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly eventRepo: IEventRepository,
        private readonly audit: AuditLogService,
    ) {}

    async execute(
        eventId: string,
        adminUserId?: string,
    ): Promise<{ eventId: string; rotatedTickets: number; deactivatedTokens: number }> {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new NotFoundDomainException('Event not found');

        const now = new Date();
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const bumped = await qr.manager
                .createQueryBuilder()
                .update(TicketOrmEntity)
                .set({
                    qrGenerationVersion: () => 'qr_generation_version + 1',
                    updatedAt: now,
                })
                .where('event_id = :eventId', { eventId })
                .execute();

            const deactivated = await qr.manager
                .createQueryBuilder()
                .update(TicketQrTokenOrmEntity)
                .set({ active: false, updatedAt: now })
                .where(
                    'ticket_id IN (SELECT id FROM tickets WHERE event_id = :eventId)',
                    { eventId },
                )
                .andWhere('active = true')
                .execute();

            await qr.commitTransaction();
            this.logger.log(
                `rotate-qr event=${eventId} tickets=${bumped.affected ?? 0} tokens=${deactivated.affected ?? 0}`,
            );
            await this.audit.record({
                action: 'event.rotate_qr',
                targetType: 'event',
                targetId: eventId,
                actorUserId: adminUserId ?? null,
                metadata: {
                    rotatedTickets: bumped.affected ?? 0,
                    deactivatedTokens: deactivated.affected ?? 0,
                },
            });
            return {
                eventId,
                rotatedTickets: bumped.affected ?? 0,
                deactivatedTokens: deactivated.affected ?? 0,
            };
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }
}
