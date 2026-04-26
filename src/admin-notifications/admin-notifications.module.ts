import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminNotificationOrmEntity } from './infrastructure/orm/admin-notification.orm.entity';
import { AdminNotificationService } from './application/services/admin-notification.service';
import { AdminNotificationsController } from './infrastructure/controllers/admin-notifications.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AdminNotificationOrmEntity])],
    providers: [AdminNotificationService],
    controllers: [AdminNotificationsController],
    exports: [AdminNotificationService],
})
export class AdminNotificationsModule {}
