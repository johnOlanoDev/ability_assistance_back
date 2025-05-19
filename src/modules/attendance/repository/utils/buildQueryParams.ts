import { CustomDateRange, DateRangeFilter } from "@/types";

export const buildQueryParams = (
  filter: DateRangeFilter,
  customRange?: CustomDateRange,
  type?: string,
  companyId?: string
) => {
  const params = new URLSearchParams();

  params.append("filter", filter);

  if (filter === "custom" && customRange?.startDate && customRange.endDate) {
    params.append("startDate", customRange.startDate);
    params.append("endDate", customRange.endDate);
  }

  if (type) {
    params.append("type", type);
  }

  if(companyId) {
    params.append("companyId", companyId)
  }

  return params.toString();
};
