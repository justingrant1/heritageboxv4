
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DigitizingOption = {
  id: string;
  name: string;
  price: number;
  time: string;
  description: string;
}

export const digitizingOptions: DigitizingOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 0,
    time: '4-6 weeks',
    description: 'Our standard digitizing service'
  },
  {
    id: 'expedited',
    name: 'Expedited',
    price: 29.99,
    time: '2-3 weeks',
    description: 'Faster processing of your memories'
  },
  {
    id: 'rush',
    name: 'Rush',
    price: 64.99,
    time: '10 business days',
    description: 'Priority handling for urgent projects'
  }
];

export const getDigitizingOptionById = (id: string): DigitizingOption => {
  return digitizingOptions.find(option => option.id === id) || digitizingOptions[0];
};
