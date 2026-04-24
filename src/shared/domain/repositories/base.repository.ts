import { IReadOnlyRepository } from "./read-only.repository";
import { IWriteOnlyRepository } from "./write-only.repository";

export interface IBaseRepository<T, QueryT> extends IReadOnlyRepository<T, QueryT>, IWriteOnlyRepository<T> {
}