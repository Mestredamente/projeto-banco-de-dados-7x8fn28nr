import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/system/Input'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

const COUNTRIES = [
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+1', name: 'EUA/Canadá', flag: '🇺🇸' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+598', name: 'Uruguai', flag: '🇺🇾' },
]

export function PhoneInput({ value, onChange, className, required, disabled }: PhoneInputProps) {
  const match = (value || '').match(/^(\+\d{1,3})(.*)$/)
  const ddi = match ? match[1] : '+55'
  const rest = match ? match[2] : value

  const handleDdiChange = (newDdi: string) => {
    const rawRest = rest.replace(/\D/g, '')
    onChange(newDdi + rawRest)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawNum = e.target.value.replace(/\D/g, '')
    onChange(ddi + rawNum)
  }

  return (
    <div className={cn('flex gap-2 w-full', className)}>
      <Select value={ddi} onValueChange={handleDdiChange} disabled={disabled}>
        <SelectTrigger className="w-[110px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                {c.flag} {c.code}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        mask="phone"
        placeholder="(00) 00000-0000"
        value={rest}
        onChange={handleNumberChange}
        required={required}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  )
}
