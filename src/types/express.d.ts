import { UserPayload } from "../modules/auth/types/JwtPayload";

declare global {
    namespace Express {
        interface Request {
            user: UserPayload;
        }
    }
}
