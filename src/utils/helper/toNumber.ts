import { Decimal } from "@prisma/client/runtime/library";

export function toNumber(value: Decimal | null): number | null {
    return value ? parseFloat(value.toString()) : null;
  }