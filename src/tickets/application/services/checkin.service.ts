import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckinOrmEntity } from '../../infrastructure/orm/checkin.orm.entity';
import { CheckinMapper } from '../../infrastructure/mapper/checkin.mapper';
import { CheckinEntity } from '../../domain/entities/checkin.entity';
import { ICheckinRepository } from '../../domain/repositories/checkin.repository';
import { CheckinResult } from '../../domain/types/checkin-rejection-reason';

@Injectable()
export class CheckinService implements ICheckinRepository {
    constructor(
        @InjectRepository(CheckinOrmEntity)
        private readonly repo: Repository<CheckinOrmEntity>,
    ) {}

    async findAcceptedByTicket(
        ticketId: string,
    ): Promise<CheckinEntity | null> {
        const row = await this.repo.findOne({
            where: { ticketId, result: CheckinResult.ACCEPTED },
            order: { scannedAt: 'DESC' },
        });
        return row ? CheckinMapper.toDomain(row) : null;
    }

    async findByTicket(ticketId: string): Promise<CheckinEntity[]> {
        const rows = await this.repo.find({
            where: { ticketId },
            order: { scannedAt: 'DESC' },
        });
        return rows.map(CheckinMapper.toDomain);
    }

    async create(entity: CheckinEntity): Promise<CheckinEntity> {
        const row = this.repo.create(CheckinMapper.toPersistance(entity));
        const saved = await this.repo.save(row);
        return CheckinMapper.toDomain(saved);
    }
}
