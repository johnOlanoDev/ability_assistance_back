

import { Location } from "@/types";

export const getLocation = async (): Promise<Location | null> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error("La geolocalización no está disponible en este navegador.")
      );
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        reject(new Error(`Error al obtener la ubicación: ${error.message}`));
      }
    );
  });
};