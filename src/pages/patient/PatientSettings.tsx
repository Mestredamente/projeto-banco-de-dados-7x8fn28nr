import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Lock, ShieldCheck, Calendar, Phone, CheckCircle2, UserCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { maskPhone } from '@/lib/masks'

export default function PatientSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [patient, setPatient] = useState<any>(null)

  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [dateError, setDateError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!user) return
    setPhone(user.phone || '')

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
      setPhoneError('')
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
    const minDate = new Date('1900-01-01')
    if (d < minDate) {
      setDateError('Data de nascimento muito antiga.')
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
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar seus dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (newPassword.length < 8) {
      setPasswordError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setPasswordError('')
    setPasswordLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a senha.',
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const consentDate = patient?.consent_given_at || user?.consent_given_at

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-primary" />
          Minhas Configurações
        </h1>
        <p className="text-gray-500 mt-1">Gerencie seus dados pessoais e segurança da conta.</p>
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
                  Email
                  <Lock className="w-3 h-3 text-gray-400" />
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
                  CPF
                  <Lock className="w-3 h-3 text-gray-400" />
                </Label>
                <Input
                  value={user?.cpf || 'Não informado'}
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
                  <ShieldCheck className="w-3 h-3 text-gray-400" />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>Mantenha sua conta segura com uma senha forte.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordError('')
                }}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPasswordError('')
                }}
                placeholder="Repita a nova senha"
              />
            </div>
            {passwordError && (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Use no mínimo 8 caracteres, incluindo letras e números para maior segurança.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={passwordLoading || !newPassword || !confirmPassword}
                variant="default"
                className="px-8"
              >
                {passwordLoading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
