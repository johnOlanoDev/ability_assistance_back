import {query, body, param} from "express-validator";


export const createRoleValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage("El nombre del rol es requerido")
        .isLength({max: 30}).withMessage("Máximo 30 caracteres"),

    body('description')
        .isLength({max: 50}).withMessage("Máximo de 50 caracteres"),
]

export const idParamValidation = [
    param('id')
        .trim()
        .notEmpty().withMessage("El id es requerido")
        .isUUID().withMessage('Id inválido')
]

export const nameParamValidation = [
    param('name')
        .trim()
        .notEmpty().withMessage("El nombre es requerido")
]

export const paginationValidation = [
    query("cursorId")
        .optional()
        .isUUID().withMessage("CursorId inválido"),

    query("take")
        .optional({nullable: true})
        .isInt({min: 1, max: 100}).withMessage("El valor de take debe ser un número")
]