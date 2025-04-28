import { body, query, param } from "express-validator";

export const createPermissionValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del cargo es requerido")
    .isLength({ max: 30 })
    .withMessage("Máximo 30 caracteres"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ max: 50 })
    .withMessage("Máximo 50 caracteres"),

  body("status")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano"),
];

export const idParamPermissionValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("El id es requerido")
    .isUUID()
    .withMessage("Id inválido"),
];

export const nameParamPermissionValidation = [
  param("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del cargo es requerido"),
];

export const paginationValidation = [
  query("cursorId")
    .optional()
    .isUUID()
    .withMessage("Cursor Id inválido"),

  query("take")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("El valor de take debe ser un número entre 1 y 100"),
];