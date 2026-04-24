import { DataSource, In } from 'typeorm';
import { Logger } from '@nestjs/common';
import { OrderEntity } from '../../../../tickets/domain/entities/order.entity';
import { TicketEntity } from '../../../../tickets/domain/entities/ticket.entity';
import { InventoryHoldEntity } from '../../../../tickets/domain/entities/inventory-hold.entity';
import { IOrderRepository } from '../../../../tickets/domain/repositories/order.repository';
import { IOrderItemRepository } from '../../../../tickets/domain/repositories/order-item.repository';
import { ITicketRepository } from '../../../../tickets/domain/repositories/ticket.repository';
import { IInventoryHoldRepository } from '../../../../tickets/domain/repositories/inventory-hold.repository';
import { OrderStatus } from '../../../../tickets/domain/types/order-status';
import {
    OWNABLE_TICKET_STATUSES,
    TicketStatus,
} from '../../../../tickets/domain/types/ticket-status';
import { InventoryHoldStatus } from '../../../../tickets/domain/types/inventory-hold-status';
import { TicketSectionOrmEntity } from '../../../../events/infrastructure/orm/ticket-section.orm.entity';
import { TicketOrmEntity } from '../../../../tickets/infrastructure/orm/ticket.orm.entity';
import { InventoryHoldOrmEntity } from '../../../../tickets/infrastructure/orm/inventory-hold.orm.entity';

const logger = new Logger('issueTicketsForOrder');

/**
 * Materialize tickets for a paid order. Idempotent: if tickets already exist
 * for the order, returns them without re-issuing. Runs inside a transaction.
 *
 * Before emitting tickets we re-check inventory under a section-level lock
 * to catch the edge case where the hold expired and a concurrent order
 * consumed the seats. When oversell would occur we DO NOT emit — we flip
 * the order to PAID + needs_reconciliation=true so ops can refund or
 * override manually.
 */
export async function issueTicketsForOrder(
    dataSource: DataSource,
    repos: {
        orderRepo: IOrderRepository;
        orderItemRepo: IOrderItemRepository;
        ticketRepo: ITicketRepository;
        inventoryHoldRepo: IInventoryHoldRepository;
    },
    order: OrderEntity,
): Promise<TicketEntity[]> {
    const existing = await repos.ticketRepo.findByOrder(order.id);
    if (existing.length > 0) return existing;

    const items = await repos.orderItemRepo.findByOrder(order.id);
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
        // Re-check inventory under a section lock per item. If any section
        // would go over capacity, flag for reconciliation and stop emitting.
        const now = new Date();
        for (const item of items) {
            const lockedSection = await qr.manager.findOne(
                TicketSectionOrmEntity,
                {
                    where: { id: item.ticketSectionId },
                    lock: { mode: 'pessimistic_write' },
                },
            );
            if (!lockedSection) continue;

            const issuedCount = await qr.manager.count(TicketOrmEntity, {
                where: {
                    ticketSectionId: item.ticketSectionId,
                    status: In(OWNABLE_TICKET_STATUSES),
                },
            });
            const activeHoldsRaw = await qr.manager
                .createQueryBuilder(InventoryHoldOrmEntity, 'h')
                .select('COALESCE(SUM(h.quantity), 0)', 'sum')
                .where('h.ticket_section_id = :sid', {
                    sid: item.ticketSectionId,
                })
                .andWhere('h.status = :status', {
                    status: InventoryHoldStatus.ACTIVE,
                })
                .andWhere('h.expires_at > :now', { now })
                .andWhere('h.order_id <> :orderId', { orderId: order.id })
                .getRawOne<{ sum: string }>();
            const otherActiveHolds = parseInt(
                activeHoldsRaw?.sum ?? '0',
                10,
            );

            // Our own hold may have expired — we still count ourselves via
            // `item.quantity`, regardless of the hold row.
            const projected = issuedCount + otherActiveHolds + item.quantity;
            if (projected > lockedSection.totalInventory) {
                logger.error(
                    `Oversell blocked: order ${order.id} section ${item.ticketSectionId} ` +
                        `issued=${issuedCount} + otherHolds=${otherActiveHolds} + want=${item.quantity} ` +
                        `> capacity=${lockedSection.totalInventory}`,
                );
                await repos.orderRepo.update(
                    new OrderEntity({
                        ...order,
                        id: order.id,
                        createdAt: order.createdAt,
                        status: OrderStatus.PAID,
                        needsReconciliation: true,
                        reconciliationReason: 'OVERSOLD_AFTER_HOLD_EXPIRED',
                        updatedAt: now,
                    } as any),
                );
                await qr.commitTransaction();
                return [];
            }
        }

        const issued: TicketEntity[] = [];
        for (const item of items) {
            for (let i = 0; i < item.quantity; i++) {
                const ticket = new TicketEntity({
                    orderItemId: item.id,
                    originalOrderId: order.id,
                    currentOwnerUserId: order.userId,
                    eventId: item.eventId,
                    eventSessionId: item.eventSessionId,
                    ticketSectionId: item.ticketSectionId,
                    ticketSalePhaseId: item.ticketSalePhaseId,
                    status: TicketStatus.ISSUED,
                    ownershipVersion: 1,
                    faceValue: item.unitPrice,
                    currency: order.currency,
                    qrGenerationVersion: 1,
                });
                issued.push(await repos.ticketRepo.create(ticket));
            }
        }

        // Consume inventory holds attached to this order
        const holds = await repos.inventoryHoldRepo.findByOrder(order.id);
        for (const h of holds) {
            if (h.status === InventoryHoldStatus.ACTIVE) {
                await repos.inventoryHoldRepo.update(
                    new InventoryHoldEntity({
                        ...h,
                        id: h.id,
                        createdAt: h.createdAt,
                        status: InventoryHoldStatus.CONSUMED,
                        updatedAt: new Date(),
                    } as any),
                );
            }
        }

        // Flip order to PAID
        if (order.status !== OrderStatus.PAID) {
            await repos.orderRepo.update(
                new OrderEntity({
                    ...order,
                    id: order.id,
                    createdAt: order.createdAt,
                    status: OrderStatus.PAID,
                    updatedAt: new Date(),
                } as any),
            );
        }

        await qr.commitTransaction();
        return issued;
    } catch (err) {
        await qr.rollbackTransaction();
        throw err;
    } finally {
        await qr.release();
    }
}
