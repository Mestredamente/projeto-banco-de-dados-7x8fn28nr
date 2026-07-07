import { maskPhone } from '@/lib/masks'

const FIELD_LABELS: Record<string, string> = {
  telefone: 'Telefone',
  'Endereço - CEP': 'Endereço - CEP',
  'Endereço - Logradouro': 'Endereço - Logradouro',
  'Endereço - Número': 'Endereço - Número',
  'Endereço - Complemento': 'Endereço - Complemento',
  'Endereço - Bairro': 'Endereço - Bairro',
  'Endereço - Cidade': 'Endereço - Cidade',
  'Endereço - Estado': 'Endereço - Estado',
  data_nascimento: 'Data de Nascimento',
  profissao: 'Profissão',
  profile_photo: 'Foto de Perfil',
}

export function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName
}

export function formatAuditValue(fieldName: string, value: string): string {
  if (!value) return '—'
  if (fieldName === 'profile_photo') return 'Foto atualizada'
  if (fieldName === 'telefone') return maskPhone(value)
  if (fieldName === 'data_nascimento') {
    try {
      return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    } catch {
      return value
    }
  }
  return value
}
