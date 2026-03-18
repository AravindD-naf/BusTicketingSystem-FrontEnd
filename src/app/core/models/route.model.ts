import { Bus } from './bus.model';
import { SeatLayoutResponse } from './seat.model';
export interface City {
  cityId?: number;
  name: string;
}

export interface Route {
  routeId: number;
  sourceId: number;
  destinationId: number;
  sourceName: string;
  destinationName: string;
  distance: number;
  baseFare: number;
  estimatedDuration: string;
  source?: City;
  destination?: City;
}

export interface RouteListResponse {
  success: boolean;
  data: Route[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface RouteResponse {
  success: boolean;
  data: Route;
}

// Schedule Models
export interface Schedule {
  scheduleId: number;
  busId: number;
  routeId: number;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  status: string;
  bus: Bus;
  route: Route;
}

export interface ScheduleListResponse {
  success: boolean;
  data: Schedule[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ScheduleResponse {
  success: boolean;
  data: Schedule;
}

export interface AvailableSeatsResponse {
  success: boolean;
  data: SeatLayoutResponse;
}

// Source/Destination Models
export interface Source {
  sourceId: number;
  sourceName: string;
  description: string;
}

export interface Destination {
  destinationId: number;
  destinationName: string;
  description: string;
}

export interface SourceListResponse {
  success: boolean;
  data: Source[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface DestinationListResponse {
  success: boolean;
  data: Destination[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}