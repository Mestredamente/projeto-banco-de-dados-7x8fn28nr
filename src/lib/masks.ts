export function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

export function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18)
}

export function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

export function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    .slice(0, 15)
}

export function maskCRP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 10)
}

export function maskCurrency(value: string) {
  const v = value.replace(/\D/g, '')
  if (!v) return ''
  const parsed = (parseInt(v, 10) / 100).toFixed(2)
  return `R$ ${parsed.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export function aplicarMascara(
  valor: string,
  tipo: 'cpf' | 'cnpj' | 'cep' | 'phone' | 'crp' | 'currency' | 'date',
) {
  if (!valor) return ''
  switch (tipo) {
    case 'cpf':
      return maskCPF(valor)
    case 'cnpj':
      return maskCNPJ(valor)
    case 'cep':
      return maskCEP(valor)
    case 'phone':
      return maskPhone(valor)
    case 'crp':
      return maskCRP(valor)
    case 'currency':
      return maskCurrency(valor)
    case 'date': {
      const v = valor.replace(/\D/g, '')
      return v
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
        .slice(0, 10)
    }
    default:
      return valor
  }
}
