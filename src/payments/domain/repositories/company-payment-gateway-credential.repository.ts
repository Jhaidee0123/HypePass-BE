import { CompanyPaymentGatewayCredentialEntity } from '../entities/company-payment-gateway-credential.entity';
import { PaymentGatewayName } from '../types/payment-gateway-name';

export interface ICompanyPaymentGatewayCredentialRepository {
    findById(
        id: string,
    ): Promise<CompanyPaymentGatewayCredentialEntity | null>;
    findByCompany(
        companyId: string,
    ): Promise<CompanyPaymentGatewayCredentialEntity[]>;
    findOne(
        companyId: string,
        gateway: PaymentGatewayName,
    ): Promise<CompanyPaymentGatewayCredentialEntity | null>;
    create(
        entity: CompanyPaymentGatewayCredentialEntity,
    ): Promise<CompanyPaymentGatewayCredentialEntity>;
    update(
        entity: CompanyPaymentGatewayCredentialEntity,
    ): Promise<CompanyPaymentGatewayCredentialEntity>;
    delete(id: string): Promise<void>;
}
