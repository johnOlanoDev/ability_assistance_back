import {PrismaClient} from '@prisma/client';
import {injectable} from 'tsyringe';

@injectable()
export class UploadRepository {
    constructor(private readonly prisma: PrismaClient) {
    }

    /*async updateUserImage(userId: string, imageUrl: string) {
        return this.prisma.user.update({
            where: {id: userId},
            data: {imageUrl}
        });
    }*/
}