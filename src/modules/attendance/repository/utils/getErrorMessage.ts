import axios from "axios";

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.data.message || "Ocurrió un error inesperado";
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return "Ha ocurrido un error inesperado";
  }
};
