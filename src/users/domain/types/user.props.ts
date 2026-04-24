export type UserProps = {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
    role: string;
    banned?: boolean | null;
    phoneNumber?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
};
