import { body, param, query } from "express-validator";
import { AppError } from "@/middleware/errors/AppError";

export const createUserValidation = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 30 })
    .withMessage("El nombre no puede tener más de 30 caracteres"),
  body("lastName")
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ max: 30 })
    .withMessage("El apellido no puede tener más de 30 caracteres"),
  body("email")
    .isEmail()
    .withMessage("El email no es válido")
    .trim()
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .isLength({ max: 60 })
    .withMessage("La contraseña no puede tener más de 60 caracteres"),
  body("numberDocument")
    .notEmpty()
    .withMessage("El número de documento es obligatorio"),
  body("gender")
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("El género no es válido"),
  body("salary")
    .isDecimal({ decimal_digits: "2" })
    .withMessage("El salario debe ser un número con 2 decimales")
    .custom((value) => {
      const numericValue = parseFloat(value);
      if (numericValue <= 0 || numericValue > 10000000) {
        throw new AppError(
          "El salario debe ser mayor a 0 y menor a 10,000,000",
          400
        );
      }
      return true;
    }),
  body("birthDate")
    .isISO8601()
    .toDate()
    .withMessage("La fecha de nacimiento no es válida")
    .custom((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        throw new AppError("El usuario debe ser mayor de edad", 400);
      }
      return true;
    }),
  body("companyId")
    .optional() // Si es opcional según tu modelo
    .isUUID()
    .withMessage("El companyId debe ser un UUID válido"),
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
  param("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del cargo es requerido"),
];

export const paginationValidation = [
  query("cursorId").optional().isUUID().withMessage("Cursor Id inválido"),

  query("take")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("El valor de take debe ser un número entero entre 1 y 100"),
];

export const updateProfileValidation = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 30 })
    .withMessage("El nombre no puede tener más de 30 caracteres"),
  body("lastName")
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ max: 30 })
    .withMessage("El apellido no puede tener más de 30 caracteres"),
    body("phoneNumber").optional().matches(/^9\d{8}$/),
  body("birthDate")
    .isISO8601()
    .toDate()
    .withMessage("La fecha de nacimiento no es válida")
    .custom((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        throw new AppError("El usuario debe ser mayor de edad", 400);
      }
      return true;
    }),
];
