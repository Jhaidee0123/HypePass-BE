import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettingOrmEntity } from './infrastructure/orm/platform-setting.orm.entity';
import { PlatformSettingsService } from './application/services/platform-settings.service';
import { AdminPlatformSettingsController } from './infrastructure/controllers/admin-platform-settings.controller';
import { PublicPlatformStatusController } from './infrastructure/controllers/public-platform-status.controller';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([PlatformSettingOrmEntity])],
    providers: [PlatformSettingsService],
    controllers: [AdminPlatformSettingsController, PublicPlatformStatusController],
    exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
