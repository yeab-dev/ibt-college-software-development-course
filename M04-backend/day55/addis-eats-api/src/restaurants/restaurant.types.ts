export const AREAS = ['Bole', 'Kazanchis', 'Piassa', 'Megenagna'] as const;

export type Area = (typeof AREAS)[number];

export interface Restaurant {
  readonly id: number;
  name: string;
  area: Area;
  isOpen: boolean;
}
