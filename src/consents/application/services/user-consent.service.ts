import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserConsentEntity } from '../../domain/entities/user-consent.entity';
import { IUserConsentRepository } from '../../domain/repositories/user-consent.repository';
import { UserConsentOrmEntity } from '../../infrastructure/orm/user-consent.orm.entity';
import { UserConsentMapper } from '../../infrastructure/mapper/user-consent.mapper';

@Injectable()
export class UserConsentService implements IUserConsentRepository {
    constructor(
        @InjectRepository(UserConsentOrmEntity)
        private readonly repo: Repository<UserConsentOrmEntity>,
    ) {}

    async findById(id: string): Promise<UserConsentEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? UserConsentMapper.toDomain(row) : null;
    }

    async findByUser(userId: string): Promise<UserConsentEntity[]> {
        const rows = await this.repo.find({
            where: { userId },
            order: { acceptedAt: 'DESC' },
        });
        return rows.map(UserConsentMapper.toDomain);
    }

    async findLatestForUser(
        userId: string,
    ): Promise<UserConsentEntity | null> {
        const row = await this.repo.findOne({
            where: { userId },
            order: { acceptedAt: 'DESC' },
        });
        return row ? UserConsentMapper.toDomain(row) : null;
    }

    async create(entity: UserConsentEntity): Promise<UserConsentEntity> {
        const row = this.repo.create(UserConsentMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return UserConsentMapper.toDomain(saved);
    }
}
