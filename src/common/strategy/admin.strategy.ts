// Purpose: Strategy for admin user.
// Strategy Pattern: Strategy
// Additional Info: This is a strategy for admin user.


import { injectable } from "tsyringe";

@injectable()
export class AdminStrategy {
    async execute<T>(serviceMethod: (companyId: string, ...args: any[]) => Promise<T>, companyId: string, ...args: any[]): Promise<T> {
        return serviceMethod(companyId, ...args);
    }
}