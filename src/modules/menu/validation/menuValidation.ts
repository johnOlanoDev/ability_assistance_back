import { body, param } from "express-validator";

export const createMenuValidation = [
  body("label")
    .notEmpty()
    .withMessage("El campo 'label' es requerido")
    .isString()
    .withMessage("El campo 'label' debe ser una cadena de texto"),
  body("path")
    .notEmpty()
    .withMessage("El campo 'path' es requerido")
    .isString()
    .withMessage("El campo 'path' debe ser una cadena de texto")
    .custom((value) => {
      if (!value.startsWith("/")) {
        throw new Error("El campo 'path' debe comenzar con '/'");
      }
      return true;
    }),
  body("icon")
    .notEmpty()
    .withMessage("El campo 'icon' es requerido")
    .isString()
    .withMessage("El campo 'icon' debe ser una cadena de texto"),
];


export const assignMenusValidation = [
  param("roleId").isUUID().withMessage("ID de rol inválido"),
  body("menuIds").isArray().withMessage("IDs de menú deben ser un array"),
];
