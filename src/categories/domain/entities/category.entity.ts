import { BaseEntity } from '../../../shared/domain/entities/base.entity';
import { CategoryProps } from '../types/category.props';

export class CategoryEntity extends BaseEntity {
    readonly name: string;
    readonly slug: string;
    readonly icon?: string | null;
    readonly sortOrder: number;
    readonly isActive: boolean;

    constructor(props: CategoryProps) {
        super(props);
        this.name = props.name;
        this.slug = props.slug;
        this.icon = props.icon;
        this.sortOrder = props.sortOrder;
        this.isActive = props.isActive;
    }
}
