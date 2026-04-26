import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicketOrmEntity } from './infrastructure/orm/support-ticket.orm.entity';
import { SupportMessageOrmEntity } from './infrastructure/orm/support-message.orm.entity';
import { SupportService } from './application/services/support.service';
import { SupportController } from './infrastructure/controllers/support.controller';
import { AdminSupportController } from './infrastructure/controllers/admin-support.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SupportTicketOrmEntity,
            SupportMessageOrmEntity,
        ]),
    ],
    providers: [SupportService],
    controllers: [SupportController, AdminSupportController],
    exports: [SupportService],
})
export class SupportModule {}
