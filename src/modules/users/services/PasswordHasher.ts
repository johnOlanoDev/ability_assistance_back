import { injectable } from "tsyringe";
import { BcryptHelper } from "@/utils/helper/bcrypt.helper";


@injectable()
export class PasswordHasher {

    /**
     * Hashear la contraseña usando Bcrypt.
     * @param plainPassword Contraseña en texto plano.
     * @returns Contraseña hasheada.
     */


    public async hashPassword(plainPassword: string): Promise<string> {
        return await BcryptHelper.hashPassword(plainPassword);
    }
}