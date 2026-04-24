import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderOrmEntity } from './infrastructure/orm/order.orm.entity';
import { OrderItemOrmEntity } from './infrastructure/orm/order-item.orm.entity';
import { TicketOrmEntity } from './infrastructure/orm/ticket.orm.entity';
import { InventoryHoldOrmEntity } from './infrastructure/orm/inventory-hold.orm.entity';
import { TicketQrTokenOrmEntity } from './infrastructure/orm/ticket-qr-token.orm.entity';
import { CheckinOrmEntity } from './infrastructure/orm/checkin.orm.entity';
import { TicketTransferOrmEntity } from './infrastructure/orm/ticket-transfer.orm.entity';
import { OrderService } from './application/services/order.service';
import { OrderItemService } from './application/services/order-item.service';
import { TicketService } from './application/services/ticket.service';
import { InventoryHoldService } from './application/services/inventory-hold.service';
import { TicketQrTokenService } from './application/services/ticket-qr-token.service';
import { CheckinService } from './application/services/checkin.service';
import { TicketTransferService } from './application/services/ticket-transfer.service';
import {
    checkin_service_token,
    inventory_hold_service_token,
    order_item_service_token,
    order_service_token,
    ticket_qr_token_service_token,
    ticket_service_token,
    ticket_transfer_service_token,
} from './infrastructure/tokens/tickets.tokens';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrderOrmEntity,
            OrderItemOrmEntity,
            TicketOrmEntity,
            InventoryHoldOrmEntity,
            TicketQrTokenOrmEntity,
            CheckinOrmEntity,
            TicketTransferOrmEntity,
        ]),
    ],
    providers: [
        { provide: order_service_token, useClass: OrderService },
        { provide: order_item_service_token, useClass: OrderItemService },
        { provide: ticket_service_token, useClass: TicketService },
        {
            provide: inventory_hold_service_token,
            useClass: InventoryHoldService,
        },
        {
            provide: ticket_qr_token_service_token,
            useClass: TicketQrTokenService,
        },
        { provide: checkin_service_token, useClass: CheckinService },
        {
            provide: ticket_transfer_service_token,
            useClass: TicketTransferService,
        },
    ],
    exports: [
        order_service_token,
        order_item_service_token,
        ticket_service_token,
        inventory_hold_service_token,
        ticket_qr_token_service_token,
        checkin_service_token,
        ticket_transfer_service_token,
        TypeOrmModule,
    ],
})
export class TicketsModule {}
