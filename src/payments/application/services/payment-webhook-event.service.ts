import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentWebhookEventOrmEntity } from '../../infrastructure/orm/payment-webhook-event.orm.entity';
import { PaymentWebhookEventMapper } from '../../infrastructure/mapper/payment-webhook-event.mapper';
import { PaymentWebhookEventEntity } from '../../domain/entities/payment-webhook-event.entity';
import { IPaymentWebhookEventRepository } from '../../domain/repositories/payment-webhook-event.repository';

@Injectable()
export class PaymentWebhookEventService
    implements IPaymentWebhookEventRepository
{
    constructor(
        @InjectRepository(PaymentWebhookEventOrmEntity)
        private readonly repo: Repository<PaymentWebhookEventOrmEntity>,
    ) {}

    async findByProviderEventId(
        provider: string,
        providerEventId: string,
    ): Promise<PaymentWebhookEventEntity | null> {
        const row = await this.repo.findOne({
            where: { provider, providerEventId },
        });
        return row ? PaymentWebhookEventMapper.toDomain(row) : null;
    }

    async create(
        entity: PaymentWebhookEventEntity,
    ): Promise<PaymentWebhookEventEntity> {
        const row = this.repo.create(
            PaymentWebhookEventMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return PaymentWebhookEventMapper.toDomain(saved);
    }

    async update(
        entity: PaymentWebhookEventEntity,
    ): Promise<PaymentWebhookEventEntity> {
        await this.repo.update(
            entity.id,
            PaymentWebhookEventMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return PaymentWebhookEventMapper.toDomain(updated);
    }
}
