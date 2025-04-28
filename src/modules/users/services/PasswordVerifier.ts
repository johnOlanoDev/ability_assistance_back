import { injectable } from "tsyringe";
import { BcryptHelper } from "@/utils/helper/bcrypt.helper";

@injectable()
export class PasswordVerifier {


    /**
     * Verificar si la contraseña en texto plano es igual a la contraseña hasheada.
     * @param plainPassword Contraseña en texto plano.
     * @param hashedPassword Contraseña hasheada.
     * @returns Si la contraseña en texto plano es igual a la contraseña hasheada.
     */

    public async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await BcryptHelper.comparePassword(plainPassword, hashedPassword);
    }
}