import { UserProps } from '../types/user.props';

/**
 * Domain representation of a platform user.
 * The canonical record lives in Better Auth's `user` table; this entity is
 * used for reading and cross-module references.
 */
export class UserEntity {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly emailVerified: boolean;
    readonly image?: string | null;
    readonly role: string;
    readonly banned?: boolean | null;
    readonly phoneNumber?: string | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;

    constructor(props: UserProps) {
        this.id = props.id;
        this.email = props.email;
        this.name = props.name;
        this.emailVerified = props.emailVerified;
        this.image = props.image;
        this.role = props.role;
        this.banned = props.banned;
        this.phoneNumber = props.phoneNumber;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
