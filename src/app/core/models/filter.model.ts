export interface BusFilter {
  busTypes: string[];
  maxPrice: number;
  departureTimes: ('morning' | 'afternoon' | 'evening' | 'night')[];
  operators: string[];
  minRating: number;
}

export type SortOption = 'departure' | 'arrival' | 'price_asc' | 'price_desc' | 'duration' | 'rating';