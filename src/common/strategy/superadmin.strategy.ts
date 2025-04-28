
import { injectable } from "tsyringe";


@injectable()
export class SuperadminStrategy {
    async execute<T>(serviceMethod: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
        return serviceMethod(...args);
    }
}