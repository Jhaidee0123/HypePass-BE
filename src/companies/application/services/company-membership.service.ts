import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyMembershipOrmEntity } from '../../infrastructure/orm/company-membership.orm.entity';
import { CompanyMembershipMapper } from '../../infrastructure/mapper/company-membership.mapper';
import { CompanyMembershipEntity } from '../../domain/entities/company-membership.entity';
import { ICompanyMembershipRepository } from '../../domain/repositories/company-membership.repository';

@Injectable()
export class CompanyMembershipService
    implements ICompanyMembershipRepository
{
    constructor(
        @InjectRepository(CompanyMembershipOrmEntity)
        private readonly repo: Repository<CompanyMembershipOrmEntity>,
    ) {}

    async findByUser(userId: string): Promise<CompanyMembershipEntity[]> {
        const rows = await this.repo.find({ where: { userId } });
        return rows.map(CompanyMembershipMapper.toDomain);
    }

    async findByCompany(companyId: string): Promise<CompanyMembershipEntity[]> {
        const rows = await this.repo.find({ where: { companyId } });
        return rows.map(CompanyMembershipMapper.toDomain);
    }

    async findOne(
        companyId: string,
        userId: string,
    ): Promise<CompanyMembershipEntity | null> {
        const row = await this.repo.findOne({ where: { companyId, userId } });
        return row ? CompanyMembershipMapper.toDomain(row) : null;
    }

    async create(
        entity: CompanyMembershipEntity,
    ): Promise<CompanyMembershipEntity> {
        const row = this.repo.create(
            CompanyMembershipMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return CompanyMembershipMapper.toDomain(saved);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
