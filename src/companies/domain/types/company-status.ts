export enum CompanyStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
    /** Soft-delete. Hidden from all listings, can no longer create events
     *  or be re-approved. Audit/financial history is preserved by leaving
     *  the row intact (referential integrity for orders, payouts, etc.). */
    DELETED = 'deleted',
}
