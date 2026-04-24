import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PayoutMethodEntity } from '../../domain/entities/payout-method.entity';
import { IPayoutMethodRepository } from '../../domain/repositories/payout-method.repository';
import { PayoutMethodOrmEntity } from '../../infrastructure/orm/payout-method.orm.entity';
import { PayoutMethodMapper } from '../../infrastructure/mapper/payout-method.mapper';
import { NotFoundDomainException } from '../../../shared/infrastructure/filters/domain.exception';

@Injectable()
export class PayoutMethodService implements IPayoutMethodRepository {
    constructor(
        @InjectRepository(PayoutMethodOrmEntity)
        private readonly repo: Repository<PayoutMethodOrmEntity>,
        private readonly dataSource: DataSource,
    ) {}

    async findById(id: string): Promise<PayoutMethodEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? PayoutMethodMapper.toDomain(row) : null;
    }

    async findByUser(userId: string): Promise<PayoutMethodEntity[]> {
        const rows = await this.repo.find({
            where: { userId },
            order: { isDefault: 'DESC', createdAt: 'ASC' },
        });
        return rows.map(PayoutMethodMapper.toDomain);
    }

    async findDefaultForUser(
        userId: string,
    ): Promise<PayoutMethodEntity | null> {
        const row = await this.repo.findOne({
            where: { userId, isDefault: true },
        });
        return row ? PayoutMethodMapper.toDomain(row) : null;
    }

    async create(entity: PayoutMethodEntity): Promise<PayoutMethodEntity> {
        const row = this.repo.create(
            PayoutMethodMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return PayoutMethodMapper.toDomain(saved);
    }

    async update(entity: PayoutMethodEntity): Promise<PayoutMethodEntity> {
        await this.repo.update(
            entity.id,
            PayoutMethodMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return PayoutMethodMapper.toDomain(updated);
    }

    async setDefault(
        userId: string,
        payoutMethodId: string,
    ): Promise<PayoutMethodEntity> {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const target = await qr.manager.findOne(PayoutMethodOrmEntity, {
                where: { id: payoutMethodId, userId },
            });
            if (!target) {
                throw new NotFoundDomainException('Payout method not found');
            }
            await qr.manager.update(
                PayoutMethodOrmEntity,
                { userId },
                { isDefault: false, updatedAt: new Date() },
            );
            await qr.manager.update(
                PayoutMethodOrmEntity,
                { id: payoutMethodId },
                { isDefault: true, updatedAt: new Date() },
            );
            await qr.commitTransaction();
            const fresh = await this.repo.findOneOrFail({
                where: { id: payoutMethodId },
            });
            return PayoutMethodMapper.toDomain(fresh);
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
