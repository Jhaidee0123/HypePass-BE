import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { OrderOrmEntity } from '../../infrastructure/orm/order.orm.entity';
import { OrderItemOrmEntity } from '../../infrastructure/orm/order-item.orm.entity';
import { TicketOrmEntity } from '../../infrastructure/orm/ticket.orm.entity';
import { OrderStatus, OrderType } from '../../domain/types/order-status';
import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';

export type AdminOrderRow = {
    id: string;
    createdAt: string;
    status: OrderStatus;
    type: OrderType;
    currency: string;
    grandTotal: number;
    platformFeeTotal: number;
    paymentReference: string;
    buyerEmail: string;
    buyerFullName: string;
    needsReconciliation: boolean;
    reconciliationReason: string | null;
    companyId: string | null;
};

export type AdminOrderListResult = {
    items: AdminOrderRow[];
    total: number;
    limit: number;
    offset: number;
};

export type AdminOrderListFilter = {
    status?: OrderStatus;
    type?: OrderType;
    q?: string;
    needsReconciliation?: boolean;
    companyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
};

const toRow = (orm: OrderOrmEntity): AdminOrderRow => ({
    id: orm.id,
    createdAt: orm.createdAt.toISOString(),
    status: orm.status,
    type: orm.type,
    currency: orm.currency,
    grandTotal: orm.grandTotal,
    platformFeeTotal: orm.platformFeeTotal,
    paymentReference: orm.paymentReference,
    buyerEmail: orm.buyerEmail,
    buyerFullName: orm.buyerFullName,
    needsReconciliation: orm.needsReconciliation,
    reconciliationReason: orm.reconciliationReason,
    companyId: orm.companyId,
});

@Injectable()
export class AdminOrderService {
    constructor(
        @InjectRepository(OrderOrmEntity)
        private readonly orders: Repository<OrderOrmEntity>,
        @InjectRepository(OrderItemOrmEntity)
        private readonly items: Repository<OrderItemOrmEntity>,
        @InjectRepository(TicketOrmEntity)
        private readonly tickets: Repository<TicketOrmEntity>,
    ) {}

    async list(filter: AdminOrderListFilter): Promise<AdminOrderListResult> {
        const limit = filter.limit ?? 50;
        const offset = filter.offset ?? 0;
        const where: Record<string, unknown> = {};
        if (filter.status) where.status = filter.status;
        if (filter.type) where.type = filter.type;
        if (filter.companyId) where.companyId = filter.companyId;
        if (filter.needsReconciliation !== undefined) {
            where.needsReconciliation = filter.needsReconciliation;
        }
        if (filter.dateFrom && filter.dateTo) {
            where.createdAt = Between(filter.dateFrom, filter.dateTo);
        } else if (filter.dateFrom) {
            where.createdAt = MoreThanOrEqual(filter.dateFrom);
        } else if (filter.dateTo) {
            where.createdAt = LessThanOrEqual(filter.dateTo);
        }

        let qb = this.orders
            .createQueryBuilder('o')
            .where(where)
            .orderBy('o.createdAt', 'DESC')
            .take(limit)
            .skip(offset);

        if (filter.q) {
            const needle = `%${filter.q}%`;
            qb = qb.andWhere(
                '(o.buyer_email ILIKE :n OR o.buyer_full_name ILIKE :n OR o.payment_reference ILIKE :n)',
                { n: needle },
            );
        }

        const [rows, total] = await qb.getManyAndCount();
        return { items: rows.map(toRow), total, limit, offset };
    }

    async getDetail(orderId: string) {
        const order = await this.orders.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundDomainException(`order ${orderId} not found`);
        const items = await this.items.find({ where: { orderId } });
        const itemIds = items.map((i) => i.id);
        const tickets = itemIds.length
            ? await this.tickets.find({ where: itemIds.map((id) => ({ orderItemId: id })) })
            : [];
        return {
            order: toRow(order),
            buyer: {
                email: order.buyerEmail,
                fullName: order.buyerFullName,
                phone: order.buyerPhone,
                legalId: order.buyerLegalId,
                legalIdType: order.buyerLegalIdType,
            },
            items: items.map((i) => ({
                id: i.id,
                eventId: i.eventId,
                eventSessionId: i.eventSessionId,
                ticketSectionId: i.ticketSectionId,
                ticketSalePhaseId: i.ticketSalePhaseId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal,
            })),
            tickets: tickets.map((tk) => ({
                id: tk.id,
                status: tk.status,
                ownerUserId: tk.currentOwnerUserId,
                eventId: tk.eventId,
                createdAt: tk.createdAt.toISOString(),
            })),
        };
    }

    async markReconciled(orderId: string): Promise<AdminOrderRow> {
        const order = await this.orders.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundDomainException(`order ${orderId} not found`);
        await this.orders.update(
            { id: orderId },
            { needsReconciliation: false, reconciliationReason: null },
        );
        const next = await this.orders.findOneOrFail({ where: { id: orderId } });
        return toRow(next);
    }
}

// Keep the helpers reachable for future expansion of the filter (e.g. buyer-id search).
void ILike;
