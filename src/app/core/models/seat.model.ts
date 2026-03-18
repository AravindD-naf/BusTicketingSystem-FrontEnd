// Seat Models
export type SeatStatus = 'available' | 'booked';
export type SeatType = 'seater' | 'sleeper';
export type DeckType = 'lower' | 'upper';
export type Gender = 'M' | 'F' | null;

export interface Seat {
  seatId: string;
  num: string;
  type: SeatType;
  status: SeatStatus;
  deck: DeckType;
  gender: Gender;
  price: number;
}

export type SeatRow = (Seat | null)[];

export interface SeatDeck {
  rows: SeatRow[];
}

export interface SeatLayoutResponse {
  busId: string;
  totalSeats: number;
  aisleAfterCol: number;
  decks: {
    lower: SeatRow[];
    upper?: SeatRow[];
  };
  boardingPoints: BoardingPoint[];
  dropPoints: DropPoint[];
}

export interface BoardingPoint {
  id: string;
  name: string;
  time: string;
  extra?: string;
  address?: string;
}

export interface DropPoint {
  id: string;
  name: string;
  time: string;
  extra?: string;
  address?: string;
}