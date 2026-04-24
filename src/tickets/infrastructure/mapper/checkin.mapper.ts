import { CheckinEntity } from '../../domain/entities/checkin.entity';
import { CheckinOrmEntity } from '../orm/checkin.orm.entity';

export class CheckinMapper {
    static toDomain(orm: CheckinOrmEntity): CheckinEntity {
        return new CheckinEntity({
            id: orm.id,
            ticketId: orm.ticketId,
            eventSessionId: orm.eventSessionId,
            scannedByUserId: orm.scannedByUserId,
            scannerDeviceId: orm.scannerDeviceId,
            result: orm.result,
            rejectionReason: orm.rejectionReason,
            scannedAt: orm.scannedAt,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        });
    }

    static toPersistance(entity: CheckinEntity): Partial<CheckinOrmEntity> {
        return {
            id: entity.id,
            ticketId: entity.ticketId ?? null,
            eventSessionId: entity.eventSessionId ?? null,
            scannedByUserId: entity.scannedByUserId ?? null,
            scannerDeviceId: entity.scannerDeviceId ?? null,
            result: entity.result,
            rejectionReason: entity.rejectionReason ?? null,
            scannedAt: entity.scannedAt,
        };
    }
}
