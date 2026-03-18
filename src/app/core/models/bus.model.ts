// API Response Models
export interface Bus {
  busId: number;
  busNumber: string;
  busType: string;
  totalSeats: number;
  operatorName: string;
  status: string;
}

export interface BusListResponse {
  success: boolean;
  data: Bus[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface BusResponse {
  success: boolean;
  data: Bus;
}

// Frontend Models (for display)
export interface BusDisplay {
  id: string;
  operatorName: string;
  operatorCode: string;
  busType: BusType;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  seatsAvailable: number;
  price: number;
  originalPrice?: number;
  rating: number;
  amenities: Amenity[];
  featured?: boolean;
}

export type BusType = 'AC Sleeper' | 'Non-AC Sleeper' | 'AC Seater' | 'Non-AC Seater' | 'Volvo AC Sleeper' | 'AC Semi-Sleeper';

export type Amenity = 'WiFi' | 'Charging Point' | 'Blanket' | 'Pillow' | 'Live Tracking' | 'Water Bottle';