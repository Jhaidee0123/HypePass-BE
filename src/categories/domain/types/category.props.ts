import { BaseProps } from '../../../shared/domain/types/base.props';

export type CategoryProps = BaseProps & {
    name: string;
    slug: string;
    icon?: string | null;
    sortOrder: number;
    isActive: boolean;
};
