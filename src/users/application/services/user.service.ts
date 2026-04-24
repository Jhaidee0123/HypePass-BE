import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../../infrastructure/orm/user.orm.entity';
import { UserMapper } from '../../infrastructure/mapper/user.mapper';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { UserQueryFilter } from '../../domain/types/user-query-filter';

@Injectable()
export class UserService implements IUserRepository {
    constructor(
        @InjectRepository(UserOrmEntity)
        private readonly repo: Repository<UserOrmEntity>,
    ) {}

    async findAll(query?: UserQueryFilter): Promise<UserEntity[]> {
        const rows = await this.repo.find({ where: query ?? {} });
        return rows.map(UserMapper.toDomain);
    }

    async findById(id: string): Promise<UserEntity | null> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? UserMapper.toDomain(row) : null;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const row = await this.repo.findOne({ where: { email } });
        return row ? UserMapper.toDomain(row) : null;
    }
}
