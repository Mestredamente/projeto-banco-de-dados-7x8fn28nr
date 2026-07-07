import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Lock, Calendar, Phone, CheckCircle2, UserCircle, Mail, IdCard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { maskPhone, maskCPF } from '@/lib/masks'

export default function PatientProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState<any>(null)

  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    if (!user) return
    setPhone(maskPhone(user.phone || ''))

    pb.collection('patients')
      .getFirstListItem(`profile="${user.id}"`)
      .then((res) => {
        setPatient(res)
        if (res.date_of_birth) {
          const d = new Date(res.date_of_birth)
          if (!isNaN(d.getTime())) {
            setDateOfBirth(format(d, 'yyyy-MM-dd'))
          }
        }
      })
      .catch(() => {})
  }, [user])

  const validatePhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 0) {
      setPhoneError('')
      return true
    }
    if (digits.length < 10 || digits.length > 11) {
      setPhoneError('Telefone deve ter 10 ou 11 dígitos (com DDD).')
      return false
    }
    setPhoneError('')
    return true
  }

  const validateDate = (value: string): boolean => {
    if (!value) {
      setDateError('')
      return true
    }
    const d = new Date(value)
    if (isNaN(d.getTime())) {
      setDateError('Data de nascimento inválida.')
      return false
    }
    if (d > new Date()) {
      setDateError('Data de nascimento não pode ser no futuro.')
      return false
    }
    setDateError('')
    return true
  }

  const handlePhoneChange = (value: string) => {
    const masked = maskPhone(value)
    setPhone(masked)
    validatePhone(masked)
  }

  const handleDateChange = (value: string) => {
    setDateOfBirth(value)
    validateDate(value)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const phoneValid = validatePhone(phone)
    const dateValid = validateDate(dateOfBirth)
    if (!phoneValid || !dateValid) return

    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        phone: phone.replace(/\D/g, ''),
      })

      if (patient) {
        await pb.collection('patients').update(patient.id, {
          date_of_birth: dateOfBirth || null,
        })
      }

      toast({ title: 'Sucesso', description: 'Dados atualizados com sucesso.' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar seus dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const consentDate = patient?.consent_given_at || user?.consent_given_at

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-primary" />
          Meu Perfil
        </h1>
        <p className="text-gray-500 mt-1">Visualize e gerencie suas informações pessoais.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-primary" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>
            Algumas informações são somente leitura por segurança e conformidade com a LGPD.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Nome Completo
                  <Lock className="w-3 h-3 text-gray-400" />
                </Label>
                <Input
                  value={user?.name || ''}
                  readOnly
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  Email
                </Label>
                <Input
                  value={user?.email || ''}
                  readOnly
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <IdCard className="w-3 h-3 text-gray-400" />
                  CPF
                </Label>
                <Input
                  value={user?.cpf ? maskCPF(user.cpf) : 'Não informado'}
                  readOnly
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" />
                  Telefone
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
                {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  Data de Nascimento
                </Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
                {dateError && <p className="text-sm text-red-500">{dateError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-gray-400" />
                  Consentimento LGPD
                </Label>
                <div className="flex items-center h-9 px-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-input">
                  {consentDate ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Aceito em {format(new Date(consentDate), 'dd/MM/yyyy')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                      Não registrado
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? 'Salvando...' : 'Salvar Dados'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
