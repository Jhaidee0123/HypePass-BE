export interface IWriteOnlyRepository<T> {
    create(entity: T): Promise<T>;
    update(entity: T): Promise<T>;
    delete(id: string): Promise<void>;
}