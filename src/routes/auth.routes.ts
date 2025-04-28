import express from "express";
import { DependencyContainer } from "@/core/di/container";
import { AuthController } from "@/modules/auth/controllers/auth.controller";


const router = express.Router();
const loginController = DependencyContainer.resolve(AuthController);


router.post("/login", loginController.login);


export default router;