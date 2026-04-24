export interface IReadOnlyRepository<T, QueryT> {
    findAll(queryParams?: QueryT): Promise<T[]>;
    findById(id: string): Promise<T | null>;
}