import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PageViewOrmEntity } from './infrastructure/orm/page-view.orm.entity';
import { PageViewService } from './application/services/page-view.service';
import { GetAnalyticsUseCase } from './application/use-case/get-analytics.usecase';
import { TrackController } from './infrastructure/controllers/track.controller';
import { AdminAnalyticsController } from './infrastructure/controllers/admin-analytics.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PageViewOrmEntity])],
    providers: [
        PageViewService,
        {
            provide: GetAnalyticsUseCase,
            useFactory: (ds: DataSource) => new GetAnalyticsUseCase(ds),
            inject: [DataSource],
        },
    ],
    controllers: [TrackController, AdminAnalyticsController],
    exports: [PageViewService],
})
export class AnalyticsModule {}
