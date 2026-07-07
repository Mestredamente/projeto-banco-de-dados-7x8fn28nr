import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  Calendar,
  Phone,
  CheckCircle2,
  UserCircle,
  Mail,
  IdCard,
  Camera,
  MapPin,
  Briefcase,
  Pencil,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { maskPhone, maskCPF, maskCEP } from '@/lib/masks'
import { lookupCEP } from '@/lib/lookups'
import { ProfilePhotoUpload } from '@/components/patient/ProfilePhotoUpload'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { AuditHistorySection } from '@/components/patient/AuditHistorySection'

const EMPTY_FORM = {
  phone: '',
  date_of_birth: '',
  profession: '',
  address_cep: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
}

export default function PatientProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [originalData, setOriginalData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    pb.collection('patients')
      .getFirstListItem(`profile="${user.id}"`)
      .then((res) => {
        setPatient(res)
        populateForm(res)
      })
      .catch(() => {})
  }, [user])

  const populateForm = (record: any) => {
    const data = {
      phone: maskPhone(record.phone || ''),
      date_of_birth: record.date_of_birth ? record.date_of_birth.substring(0, 10) : '',
      profession: record.profession || '',
      address_cep: maskCEP(record.address_cep || ''),
      address_street: record.address_street || '',
      address_number: record.address_number || '',
      address_complement: record.address_complement || '',
      address_neighborhood: record.address_neighborhood || '',
      address_city: record.address_city || '',
      address_state: record.address_state || '',
    }
    setFormData(data)
    setOriginalData(data)
  }

  useRealtime(
    'patients',
    (e) => {
      if (patient && e.record.id === patient.id && !isEditing) {
        setPatient(e.record)
        populateForm(e.record)
      }
    },
    !!patient,
  )

  const handleCEPLookup = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    const data = await lookupCEP(clean)
    if (data) {
      setFormData((prev) => ({
        ...prev,
        address_street: data.street || prev.address_street,
        address_neighborhood: data.neighborhood || prev.address_neighborhood,
        address_city: data.city || prev.address_city,
        address_state: data.state || prev.address_state,
      }))
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (!phoneDigits) e.phone = 'Telefone é obrigatório.'
    else if (phoneDigits.length < 10 || phoneDigits.length > 11)
      e.phone = 'Telefone deve ter 10 ou 11 dígitos (com DDD).'

    if (!formData.address_cep.replace(/\D/g, '')) e.address_cep = 'CEP é obrigatório.'
    if (!formData.address_street.trim()) e.address_street = 'Logradouro é obrigatório.'
    if (!formData.address_number.trim()) e.address_number = 'Número é obrigatório.'
    if (!formData.address_neighborhood.trim()) e.address_neighborhood = 'Bairro é obrigatório.'
    if (!formData.address_city.trim()) e.address_city = 'Cidade é obrigatória.'
    if (!formData.address_state.trim()) e.address_state = 'Estado é obrigatório.'

    if (formData.date_of_birth) {
      const d = new Date(formData.date_of_birth)
      if (isNaN(d.getTime())) e.date_of_birth = 'Data de nascimento inválida.'
      else if (d > new Date()) e.date_of_birth = 'Data não pode ser no futuro.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!patient || !validate()) {
      if (Object.keys(errors).length > 0) {
        toast({
          title: 'Erro de validação',
          description: 'Verifique os campos destacados.',
          variant: 'destructive',
        })
      }
      return
    }
    setLoading(true)
    try {
      const updateData = {
        phone: formData.phone.replace(/\D/g, ''),
        date_of_birth: formData.date_of_birth || null,
        profession: formData.profession,
        address_cep: formData.address_cep.replace(/\D/g, ''),
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_complement: formData.address_complement,
        address_neighborhood: formData.address_neighborhood,
        address_city: formData.address_city,
        address_state: formData.address_state,
      }
      await pb.collection('patients').update(patient.id, updateData)
      if (user) {
        await pb.collection('users').update(user.id, { phone: updateData.phone })
      }
      toast({ title: 'Sucesso', description: 'Dados atualizados com sucesso.' })
      setIsEditing(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(originalData)
    setErrors({})
    setIsEditing(false)
  }

  const consentDate = patient?.consent_given_at || user?.consent_given_at
  const inputClass = (field: string) =>
    `bg-gray-50 dark:bg-gray-800 ${errors[field] ? 'border-red-500' : ''}`

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserCircle className="w-8 h-8 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-gray-500 mt-1">Visualize e gerencie suas informações pessoais.</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading} className="gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="gap-2"
              type="submit"
              form="profile-form"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setPhotoDialogOpen(true)}
          className="relative group rounded-full"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {patient?.profile_photo ? (
              <img
                src={pb.files.getURL(patient, patient.profile_photo) + '?t=' + Date.now()}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
        </button>
      </div>

      <ProfilePhotoUpload
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        patientId={patient?.id || ''}
        currentPhoto={
          patient?.profile_photo ? pb.files.getURL(patient, patient.profile_photo) : undefined
        }
        onUploaded={() => {
          if (patient) {
            pb.collection('patients')
              .getOne(patient.id)
              .then(setPatient)
              .catch(() => {})
          }
        }}
      />

      <form id="profile-form" onSubmit={handleSave}>
        <Card className="mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Nome Completo <Lock className="w-3 h-3 text-gray-400" />
                </Label>
                <Input
                  value={user?.name || ''}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" /> Email
                </Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <IdCard className="w-3 h-3 text-gray-400" /> CPF
                </Label>
                <Input
                  value={user?.cpf ? maskCPF(user.cpf) : 'Não informado'}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" /> Telefone *
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', maskPhone(e.target.value))}
                  disabled={!isEditing || loading}
                  placeholder="(11) 99999-9999"
                  className={
                    isEditing
                      ? inputClass('phone')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Data de Nascimento
                </Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                  disabled={!isEditing || loading}
                  className={
                    isEditing
                      ? inputClass('date_of_birth')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-500">{errors.date_of_birth}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-primary" /> Profissão
                </Label>
                <Input
                  value={formData.profession}
                  onChange={(e) => updateField('profession', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="Ex: Professor, Engenheiro..."
                  className={
                    isEditing
                      ? inputClass('profession')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-gray-400" /> Consentimento LGPD
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Endereço
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Preencha seu endereço. O CEP auto-completa os campos.'
                : 'Seu endereço cadastrado.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP *</Label>
                <Input
                  value={formData.address_cep}
                  onChange={(e) => {
                    const masked = maskCEP(e.target.value)
                    updateField('address_cep', masked)
                    if (isEditing) handleCEPLookup(masked)
                  }}
                  disabled={!isEditing || loading}
                  placeholder="00000-000"
                  className={
                    isEditing
                      ? inputClass('address_cep')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.address_cep && <p className="text-sm text-red-500">{errors.address_cep}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro *</Label>
                <Input
                  value={formData.address_street}
                  onChange={(e) => updateField('address_street', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="Rua, Avenida..."
                  className={
                    isEditing
                      ? inputClass('address_street')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.address_street && (
                  <p className="text-sm text-red-500">{errors.address_street}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Número *</Label>
                <Input
                  value={formData.address_number}
                  onChange={(e) => updateField('address_number', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="123"
                  className={
                    isEditing
                      ? inputClass('address_number')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.address_number && (
                  <p className="text-sm text-red-500">{errors.address_number}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={formData.address_complement}
                  onChange={(e) => updateField('address_complement', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="Apto, Bloco..."
                  className={isEditing ? '' : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'}
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro *</Label>
                <Input
                  value={formData.address_neighborhood}
                  onChange={(e) => updateField('address_neighborhood', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="Bairro"
                  className={
                    isEditing
                      ? inputClass('address_neighborhood')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.address_neighborhood && (
                  <p className="text-sm text-red-500">{errors.address_neighborhood}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cidade *</Label>
                <Input
                  value={formData.address_city}
                  onChange={(e) => updateField('address_city', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="Cidade"
                  className={
                    isEditing
                      ? inputClass('address_city')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.address_city && (
                  <p className="text-sm text-red-500">{errors.address_city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Input
                  value={formData.address_state}
                  onChange={(e) => updateField('address_state', e.target.value.toUpperCase())}
                  disabled={!isEditing || loading}
                  maxLength={2}
                  placeholder="UF"
                  className={
                    isEditing
                      ? inputClass('address_state')
                      : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  }
                />
                {errors.address_state && (
                  <p className="text-sm text-red-500">{errors.address_state}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {patient && <AuditHistorySection patientId={patient.id} />}
    </div>
  )
}
