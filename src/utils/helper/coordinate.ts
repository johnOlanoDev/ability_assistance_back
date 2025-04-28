export function validateCoordinates(
    latitude: number,
    longitude: number
  ): boolean {
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      throw new Error("Las coordenadas deben ser números válidos.");
    }
  
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(
        "Las coordenadas deben estar dentro de los límites válidos."
      );
    }
  
    return true;
  }
  
  export function getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c; // Distancia en km
    return distance;
  }


  export const getReadableAddress = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        throw new Error("Error al obtener la dirección");
      }
      const data = await response.json();
      return data.display_name || "Dirección desconocida";
    } catch (error) {
      console.error("Error al obtener la dirección:", error);
      return "Dirección desconocida";
    }
  };