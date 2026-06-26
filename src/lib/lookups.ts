import pb from '@/lib/pocketbase/client'

export async function lookupCEP(cep: string) {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    }
  } catch (e) {
    return null
  }
}

export async function lookupCNPJ(cnpj: string) {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return null
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`)
    const data = await res.json()
    if (data.message) return null
    return {
      razao_social: data.razao_social,
      address_cep: data.cep,
      address_street: data.logradouro,
      address_number: data.numero,
      address_complement: data.complemento,
      address_neighborhood: data.bairro,
      address_city: data.municipio,
      address_state: data.uf,
    }
  } catch (e) {
    return null
  }
}

export async function lookupCPF(cpf: string) {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return null
  try {
    // Attempt to find in patients
    const records = await pb.collection('patients').getList(1, 1, { filter: `cpf='${clean}'` })
    if (records.items.length > 0) {
      const r = records.items[0]
      return {
        name: r.name,
        date_of_birth: r.date_of_birth,
      }
    }
    // Attempt to find in users
    const users = await pb.collection('users').getList(1, 1, { filter: `cpf='${clean}'` })
    if (users.items.length > 0) {
      const u = users.items[0]
      return {
        name: u.name,
        date_of_birth: null,
      }
    }
    return null
  } catch (e) {
    return null
  }
}
