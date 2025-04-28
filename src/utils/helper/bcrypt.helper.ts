import bcrypt from 'bcryptjs';

export class BcryptHelper {
    private static readonly SALT_ROUNDS = 12;

    /**
     * Hashear la contraseña usando Bcrypt.
     * @param plainPassword Contraseña en texto plano.
     * @returns Contraseña hasheada.
     */
    public static async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hashSync(plainPassword, this.SALT_ROUNDS);
    }

    /**
     * Comparar la contraseña en texto plano con la contraseña hasheada.
     * @param plainPassword Contraseña en texto plano.
     * @param hashedPassword Contraseña hasheada.
     * @returns Si la contraseña en texto plano es igual a la contraseña hasheada.
     */

    public static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compareSync(plainPassword, hashedPassword);
    }
}