import { body, query, param } from "express-validator";

export const createPositionValidation = [
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
    .withMessage("Máximo 30 caracteres"),


    body("companyId")
    .trim()
    .notEmpty()
    .withMessage("El id de la empresa es requerido")
    .isUUID()
    .withMessage("Id inválido"),

    body("workplaceId")
    .trim()
    .notEmpty()
    .withMessage("El id del área de trabajo es requerido")
    .isUUID()
    .withMessage("Id inválido"),

];

export const idParamValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("El id es requerido")
    .isUUID()
    .withMessage("Id inválido"),
];

export const nameParamValidation = [
  param("name").trim().notEmpty().withMessage("El nombre del cargo es requerido"),
];

export const paginationValidation = [
  query("cursorId").optional().isUUID().withMessage("Cursor Id inválido"),

  query("take")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("El valor de take debe ser un número"),
];
