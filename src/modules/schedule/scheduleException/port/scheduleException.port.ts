// src/modules/scheduleException/ports/scheduleExceptionRepository.port.ts

import { CreateScheduleExceptionDTO, ScheduleExceptionFilters, ScheduleExceptionResponse, UpdateScheduleExceptionDTO } from "../types/scheduleException.types";

export interface IScheduleExceptionRepository {
  findScheduleExceptionById(id: string): Promise<ScheduleExceptionResponse | null>;
  
  findScheduleExceptionsByFilters(filters: ScheduleExceptionFilters): Promise<ScheduleExceptionResponse[]>;
  
  createScheduleException(data: CreateScheduleExceptionDTO): Promise<ScheduleExceptionResponse>;
  
  updateScheduleException(id: string, data: UpdateScheduleExceptionDTO): Promise<ScheduleExceptionResponse>;
  
  deleteScheduleException(id: string): Promise<boolean>;
  
  findScheduleExceptionByDate(
    date: Date | string, 
    userId?: string, 
    scheduleId?: string, 
    workplaceId?: string, 
    positionId?: string, 
    companyId?: string
  ): Promise<ScheduleExceptionResponse | null>;
  
  countScheduleExceptions(filters?: ScheduleExceptionFilters): Promise<number>;
}