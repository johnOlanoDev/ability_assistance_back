import { body, param } from "express-validator";
import { AppError } from "@/middleware/errors/AppError";

export const createCompanyValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la compañia es requerido")
    .isLength({ max: 30 })
    .withMessage("Máximo 30 caracteres"),

  body("ruc")
    .trim()
    .notEmpty()
    .withMessage("El ruc es requerido")
    .isLength({ min: 11, max: 11 })
    .withMessage("El ruc debe tener 11 caracteres")
    .custom((value) => {
      if (!value.trim().startsWith("10") && !value.trim().startsWith("20")) {
        throw new AppError("El ruc debe comenzar con 10 o 20", 400);
      }
      return true;
    }),
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la empresa es requerido")
    .isLength({ max: 50 })
    .withMessage("Máximo 50 caracteres"),
  body("colorPrimary")
    .trim()
    .notEmpty()
    .optional()
    .withMessage("El color primario es requerido")
    .isHexColor()
    .withMessage("El color primario debe ser un valor hexadecimal"),
  body("colorSecondary")
    .trim()
    .notEmpty()
    .optional()
    .withMessage("El color secundario es requerido")
    .isHexColor()
    .withMessage("El color secundario debe ser un valor hexadecimal"),
  body("colorSidebar")
    .trim()
    .notEmpty()
    .optional()
    .withMessage("El color del sidebar es requerido")
    .isHexColor()
    .withMessage("El color del sidebar debe ser un valor hexadecimal"),
  body("status")
    .trim()
    .notEmpty()
    .optional()
    .withMessage("El estado es requerido")
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano"),
];

export const idParamValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("El id es requerido")
    .isUUID()
    .withMessage("Id inválido"),
];

export const companyNameParamValidation = [
  param("companyName")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la empresa es requerido"),
];

export const rucParamValidation = [
  param("ruc").trim().notEmpty().withMessage("El ruc es requerido"),
];

export const nameParamValidation = [
  param("name").trim().notEmpty().withMessage("El nombre es requerido"),
];
