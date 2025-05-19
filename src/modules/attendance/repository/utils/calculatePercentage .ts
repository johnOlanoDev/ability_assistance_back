
export const calculatePercentage = (part: number, total: number): string => {
    if (total === 0) return '0%'; // Para evitar la división por cero
    return ((part / total) * 100).toFixed(2) + '%';
  };