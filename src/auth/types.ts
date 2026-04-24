export interface UserSession {
    user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string;
        createdAt: Date;
        updatedAt: Date;
        role?: string;
        banned?: boolean;
        banReason?: string;
        banExpires?: Date;
    };
    session: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
        createdAt: Date;
        updatedAt: Date;
        impersonatedBy?: string;
    };
}
