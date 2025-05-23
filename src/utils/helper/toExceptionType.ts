// src/utils/enum.utils.ts

import { ExceptionType } from "@/modules/schedule/scheduleException/types/scheduleException.types";

export function toExceptionType(value: string): ExceptionType {
  const validValue = Object.values(ExceptionType).find(
    (v) => v === value
  );
  if (!validValue) {
    throw new Error(`Valor inválido para ExceptionType: ${value}`);
  }
  return validValue;
}