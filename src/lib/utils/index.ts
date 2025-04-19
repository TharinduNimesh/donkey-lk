import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(...inputs));
};

export function formatDateToNow(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
