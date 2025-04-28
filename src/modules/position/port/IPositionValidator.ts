export interface IPositionValidator {
    validateCompanyExists(companyId: string): Promise<void>;
    validatePositionId(id: string): Promise<void>;
    validatePositionByName(name: string): Promise<void>;
    validatePositionExistsInCompany(
        name: string,
        companyId: string,
        workplaceId: string
    ): Promise<void>;
    validateCompanyExistsIfUpdated(companyId?: string): Promise<void>;
    validatePositionNameUniqueIfUpdated(
        name?: string,
        companyId?: string,
        workplaceId?: string,
        excludePositionId?: string
    ): Promise<void>;
}