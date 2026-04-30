import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyPaymentGatewayCredentialEntity } from '../../domain/entities/company-payment-gateway-credential.entity';
import { ICompanyPaymentGatewayCredentialRepository } from '../../domain/repositories/company-payment-gateway-credential.repository';
import { PaymentGatewayName } from '../../domain/types/payment-gateway-name';
import { CompanyPaymentGatewayCredentialOrmEntity } from '../../infrastructure/orm/company-payment-gateway-credential.orm.entity';
import { CompanyPaymentGatewayCredentialMapper } from '../../infrastructure/mapper/company-payment-gateway-credential.mapper';

@Injectable()
export class CompanyPaymentGatewayCredentialService
    implements ICompanyPaymentGatewayCredentialRepository
{
    constructor(
        @InjectRepository(CompanyPaymentGatewayCredentialOrmEntity)
        private readonly repo: Repository<CompanyPaymentGatewayCredentialOrmEntity>,
    ) {}

    async findById(
        id: string,
    ): Promise<CompanyPaymentGatewayCredentialEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row
            ? CompanyPaymentGatewayCredentialMapper.toDomain(row)
            : null;
    }

    async findByCompany(
        companyId: string,
    ): Promise<CompanyPaymentGatewayCredentialEntity[]> {
        const rows = await this.repo.find({
            where: { companyId },
            order: { createdAt: 'DESC' },
        });
        return rows.map(CompanyPaymentGatewayCredentialMapper.toDomain);
    }

    async findOne(
        companyId: string,
        gateway: PaymentGatewayName,
    ): Promise<CompanyPaymentGatewayCredentialEntity | null> {
        const row = await this.repo.findOne({
            where: { companyId, gateway },
        });
        return row
            ? CompanyPaymentGatewayCredentialMapper.toDomain(row)
            : null;
    }

    async create(
        entity: CompanyPaymentGatewayCredentialEntity,
    ): Promise<CompanyPaymentGatewayCredentialEntity> {
        const row = this.repo.create(
            CompanyPaymentGatewayCredentialMapper.toPersistance(entity),
        );
        const saved = await this.repo.save(row);
        return CompanyPaymentGatewayCredentialMapper.toDomain(saved);
    }

    async update(
        entity: CompanyPaymentGatewayCredentialEntity,
    ): Promise<CompanyPaymentGatewayCredentialEntity> {
        await this.repo.update(
            entity.id,
            CompanyPaymentGatewayCredentialMapper.toPersistance(entity),
        );
        const updated = await this.repo.findOneOrFail({
            where: { id: entity.id },
        });
        return CompanyPaymentGatewayCredentialMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
