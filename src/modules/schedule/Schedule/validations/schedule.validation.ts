import { param, body } from "express-validator";

export const idScheduleParamValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("El id es requerido")
    .isUUID()
    .withMessage("Id inválido"),
];

export const createScheduleValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del horario es requerido")
    .isLength({ max: 30 })
    .withMessage("Máximo 30 caracteres"),

  body("scheduleRanges")
    .isArray()
    .withMessage("El horario debe tener al menos un rango")
    .notEmpty()
    .withMessage("El horario debe tener al menos un rango"),
];
