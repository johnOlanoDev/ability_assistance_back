export const getDocumentValidationRules = (documentTypeId: string) => {
  switch (documentTypeId) {
    case "DNI":
      return { regex: /^\d{8}$/, message: "8 dígitos numéricos" };
    case "RUC":
      return {
        regex: /^(10|20)\d{9}$/,
        message: "11 dígitos (ej: 10123456789)",
      };
    case "CE":
      return { regex: /^\d{9}$/, message: "9 dígitos numéricos" };
    default:
      return { regex: /.*/, message: "Tipo de documento no soportado" };
  }
};
