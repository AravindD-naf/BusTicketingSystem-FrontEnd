export type BusType = 'AC Sleeper' | 'Non-AC Sleeper' | 'AC Seater' | 'Non-AC Seater' | 'Volvo AC Sleeper' | 'AC Semi-Sleeper';

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
  featured?: boolean;
}
