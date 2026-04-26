import { TicketEntity } from '../../../tickets/domain/entities/ticket.entity';

export type WalletTicketSessionInfo = {
    id: string;
    name: string | null;
    startsAt: string;
    endsAt: string;
    timezone: string;
    qrVisibleFrom: string;
};

export type WalletTicketEventInfo = {
    id: string;
    slug: string;
    title: string;
    coverImageUrl: string | null;
    locationName: string | null;
    locationAddress: string | null;
    locationLatitude: number | null;
    locationLongitude: number | null;
};

export type WalletTicketVenueInfo = {
    id: string;
    name: string;
    city: string;
    country: string;
} | null;

export type WalletTicketSectionInfo = {
    id: string;
    name: string;
};

export type WalletTicketView = {
    ticket: TicketEntity;
    event: WalletTicketEventInfo;
    session: WalletTicketSessionInfo;
    section: WalletTicketSectionInfo;
    venue: WalletTicketVenueInfo;
    qrVisibleNow: boolean;
    checkedInAt: string | null;
};

export type WalletQrResponse = {
    ticketId: string;
    token: string;
    validUntil: string;
    qrVisibleFrom: string;
};
