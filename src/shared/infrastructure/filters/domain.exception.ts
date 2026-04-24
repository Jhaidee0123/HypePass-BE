import { HttpStatus } from '@nestjs/common';

export class DomainException extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = HttpStatus.BAD_REQUEST,
        public readonly errorCode?: string,
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class NotFoundDomainException extends DomainException {
    constructor(message: string, errorCode?: string) {
        super(message, HttpStatus.NOT_FOUND, errorCode);
    }
}

export class ConflictDomainException extends DomainException {
    constructor(message: string, errorCode?: string) {
        super(message, HttpStatus.CONFLICT, errorCode);
    }
}

export class ForbiddenDomainException extends DomainException {
    constructor(message: string, errorCode?: string) {
        super(message, HttpStatus.FORBIDDEN, errorCode);
    }
}

export class UnprocessableDomainException extends DomainException {
    constructor(message: string, errorCode?: string) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }
}
