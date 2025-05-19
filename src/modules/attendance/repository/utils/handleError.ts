import { AxiosError } from "axios";

export const handleError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "No se pudo conectar con el servidor, Verifique su conexión a internet";
    }

    const status = error.response.status;
    const message =
      error.response.data?.message ||
      error.response.data?.error ||
      (typeof error.response.data === "string"
        ? error.response.data
        : "Ocurrió un error inesperado");

    if (status === 400) {
      return message;
    } else if (status === 401) {
      return "No tienes permisos para realizar esta acción.";
    } else if (status === 404) {
      return "El recurso no fue encontrado.";
    } else if (status >= 500) {
      return "Error en el servidor. Inténtalo más tarde.";
    } else {
      return `Error (${status}): ${message}`;
    }
  }

  // Si es un error de JavaScript normal
  if (error instanceof Error) {
    return error.message;
  }

  // Error del backend

  return "Ocurrió un error inesperado en el servidor";
};
