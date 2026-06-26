import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { maskCPF as mCPF, maskCRP as mCRP, maskPhone as mPhone } from './masks'

export function maskCPF(value: string) {
  return mCPF(value)
}

export function maskCRP(value: string) {
  return mCRP(value)
}

export function maskPhone(value: string) {
  return mPhone(value)
}
