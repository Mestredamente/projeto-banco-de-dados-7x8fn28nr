import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { Info } from 'lucide-react'

const STEPS = [
  'Identificação',
  'Queixa Principal',
  'História Pessoal',
  'História Médica',
  'Estilo de Vida',
  'Impressão Diagnóstica',
]

export function AnamnesisWizardModal({
  open,
  onOpenChange,
  patient,
  existingAnamnesis,
  onSuccess,
}: any) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const methods = useForm({
    defaultValues: {
      ident_marital_status: '',
      ident_schooling: '',
      ident_profession: '',
      ident_naturalness: '',
      ident_religion: '',

      comp_main: '',
      comp_duration: '',
      comp_onset: '',
      comp_prev_help: false,
      comp_prev_help_details: '',
      comp_psych_meds: false,
      comp_psych_meds_details: '',

      histp_childhood: '',
      histp_family: '',
      histp_academic: '',
      histp_social: '',
      histp_trauma: '',

      histm_diagnosis: '',
      histm_meds: '',
      histm_hosp: '',
      histm_suicide: false,
      histm_suicide_details: '',
      histm_allergies: '',
      histm_family: '',

      life_sleep: '',
      life_diet: '',
      life_physical: '',
      life_substance: '',
      life_support: '',

      diag_cid_primary: '',
      diag_cid_secondary: '',
      diag_obs: '',
      diag_approach: '',
    },
  })

  useEffect(() => {
    if (open) {
      setStep(1)
      if (existingAnamnesis) {
        methods.reset({
          ident_marital_status: existingAnamnesis.identification?.marital_status || '',
          ident_schooling: existingAnamnesis.identification?.schooling || '',
          ident_profession:
            existingAnamnesis.identification?.profession || patient?.profession || '',
          ident_naturalness: existingAnamnesis.identification?.naturalness || '',
          ident_religion: existingAnamnesis.identification?.religion || '',

          comp_main: existingAnamnesis.complaint?.main_complaint || '',
          comp_duration: existingAnamnesis.complaint?.duration || '',
          comp_onset: existingAnamnesis.complaint?.onset_details || '',
          comp_prev_help: existingAnamnesis.complaint?.previous_help || false,
          comp_prev_help_details: existingAnamnesis.complaint?.previous_help_details || '',
          comp_psych_meds: existingAnamnesis.complaint?.psychiatric_meds || false,
          comp_psych_meds_details: existingAnamnesis.complaint?.psychiatric_meds_details || '',

          histp_childhood: existingAnamnesis.history_personal?.childhood || '',
          histp_family: existingAnamnesis.history_personal?.family_relations || '',
          histp_academic: existingAnamnesis.history_personal?.academic_professional || '',
          histp_social: existingAnamnesis.history_personal?.social_affective || '',
          histp_trauma: existingAnamnesis.history_personal?.trauma_abuse || '',

          histm_diagnosis: existingAnamnesis.history_medical?.medical_diagnosis || '',
          histm_meds: existingAnamnesis.history_medical?.current_meds || '',
          histm_hosp: existingAnamnesis.history_medical?.hospitalizations || '',
          histm_suicide: existingAnamnesis.history_medical?.suicide_attempt || false,
          histm_suicide_details: existingAnamnesis.history_medical?.suicide_attempt_details || '',
          histm_allergies: existingAnamnesis.history_medical?.allergies || '',
          histm_family: existingAnamnesis.history_medical?.family_history || '',

          life_sleep: existingAnamnesis.lifestyle?.sleep_quality || '',
          life_diet: existingAnamnesis.lifestyle?.diet_quality || '',
          life_physical: existingAnamnesis.lifestyle?.physical_activity || '',
          life_substance: existingAnamnesis.lifestyle?.substance_use || '',
          life_support: existingAnamnesis.lifestyle?.support_network || '',

          diag_cid_primary: existingAnamnesis.diagnosis?.cid_primary || '',
          diag_cid_secondary: existingAnamnesis.diagnosis?.cid_secondary || '',
          diag_obs: existingAnamnesis.diagnosis?.observations || '',
          diag_approach: existingAnamnesis.diagnosis?.proposed_approach || '',
        })
      } else {
        methods.reset({
          ident_marital_status: patient?.marital_status || '',
          ident_profession: patient?.profession || '',
        })
      }
    }
  }, [open, existingAnamnesis, patient, methods])

  const handleNext = () => {
    if (step === 2) {
      const comp = methods.getValues('comp_main')
      if (!comp || comp.trim() === '') {
        toast.error('A queixa principal é obrigatória.')
        return
      }
    }
    setStep((s) => Math.min(6, s + 1))
  }

  const handlePrev = () => setStep((s) => Math.max(1, s - 1))

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)

      const payload = {
        patient: patient.id,
        professional: pb.authStore.record?.id,
        identification: {
          marital_status: data.ident_marital_status,
          schooling: data.ident_schooling,
          profession: data.ident_profession,
          naturalness: data.ident_naturalness,
          religion: data.ident_religion,
        },
        complaint: {
          main_complaint: data.comp_main,
          duration: data.comp_duration,
          onset_details: data.comp_onset,
          previous_help: data.comp_prev_help,
          previous_help_details: data.comp_prev_help_details,
          psychiatric_meds: data.comp_psych_meds,
          psychiatric_meds_details: data.comp_psych_meds_details,
        },
        history_personal: {
          childhood: data.histp_childhood,
          family_relations: data.histp_family,
          academic_professional: data.histp_academic,
          social_affective: data.histp_social,
          trauma_abuse: data.histp_trauma,
        },
        history_medical: {
          medical_diagnosis: data.histm_diagnosis,
          current_meds: data.histm_meds,
          hospitalizations: data.histm_hosp,
          suicide_attempt: data.histm_suicide,
          suicide_attempt_details: data.histm_suicide_details,
          allergies: data.histm_allergies,
          family_history: data.histm_family,
        },
        lifestyle: {
          sleep_quality: data.life_sleep,
          diet_quality: data.life_diet,
          physical_activity: data.life_physical,
          substance_use: data.life_substance,
          support_network: data.life_support,
        },
        diagnosis: {
          cid_primary: data.diag_cid_primary,
          cid_secondary: data.diag_cid_secondary,
          observations: data.diag_obs,
          proposed_approach: data.diag_approach,
        },
        status: 'completed',
      }

      if (existingAnamnesis) {
        await pb.collection('anamnesis').update(existingAnamnesis.id, payload)
        toast.success('Anamnese atualizada com sucesso!')
        onSuccess()
        onOpenChange(false)
      } else {
        await pb.collection('anamnesis').create(payload)
        toast.success('Anamnese salva com sucesso!')

        const wantsSoap = window.confirm(
          'Deseja gerar a primeira evolução SOAP com base nesta anamnese?',
        )
        if (wantsSoap) {
          const s = `Queixa principal: ${data.comp_main}\nContexto: ${data.comp_onset}`
          const o = `Observações e Estilo de vida: Sono ${data.life_sleep || '-'}, Alimentação ${data.life_diet || '-'}.`
          const a = `Impressão Diagnóstica: ${data.diag_cid_primary} ${data.diag_cid_secondary}`
          const p = `Conduta: ${data.diag_approach}`

          await pb.collection('session_notes').create({
            patient: patient.id,
            professional: pb.authStore.record?.id,
            structure: 'soap',
            soap_subjective: s,
            soap_objective: o,
            soap_assessment: a,
            soap_plan: p,
            session_number: 1,
            evolution_type: 'Evolução padrão',
            status: 'rascunho',
            session_date: new Date().toISOString(),
          })
          toast.success('Evolução SOAP gerada como rascunho. Acesse a aba Evoluções para editá-la.')
        }

        onSuccess()
        onOpenChange(false)
      }
    } catch (e: any) {
      toast.error('Erro ao salvar anamnese: ' + (e.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const { register, watch, setValue } = methods

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Avaliação Inicial (Anamnese) - {patient?.name}</DialogTitle>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Passo {step} de 6: {STEPS[step - 1]}
              </span>
              <span>{Math.round((step / 6) * 100)}%</span>
            </div>
            <Progress value={(step / 6) * 100} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FormProvider {...methods}>
            <form
              id="anamnesis-form"
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border">
                    <div>
                      <Label className="text-gray-500 text-xs">Nome Completo</Label>
                      <p className="font-medium text-sm">{patient?.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Data de Nascimento</Label>
                      <p className="font-medium text-sm">
                        {patient?.date_of_birth
                          ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs">Gênero</Label>
                      <p className="font-medium text-sm">{patient?.gender || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estado Civil</Label>
                      <Input
                        {...register('ident_marital_status')}
                        placeholder="Ex: Solteiro, Casado..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Escolaridade</Label>
                      <Input {...register('ident_schooling')} placeholder="Ex: Superior completo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Profissão</Label>
                      <Input {...register('ident_profession')} placeholder="Ex: Professor" />
                    </div>
                    <div className="space-y-2">
                      <Label>Naturalidade</Label>
                      <Input {...register('ident_naturalness')} placeholder="Ex: São Paulo, SP" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Religião / Espiritualidade</Label>
                      <Input
                        {...register('ident_religion')}
                        placeholder="Ex: Católica, Nenhuma..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label className="after:content-['*'] after:text-red-500 after:ml-0.5">
                      Queixa Principal
                    </Label>
                    <Textarea
                      {...register('comp_main')}
                      placeholder="Qual o motivo principal da busca por terapia?"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duração do Problema</Label>
                      <Input
                        {...register('comp_duration')}
                        placeholder="Ex: 6 meses, desde a infância..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fatores Desencadeantes (Início)</Label>
                      <Input
                        {...register('comp_onset')}
                        placeholder="Houve algum evento específico?"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prev_help"
                        checked={watch('comp_prev_help')}
                        onCheckedChange={(v) => setValue('comp_prev_help', !!v)}
                      />
                      <Label htmlFor="prev_help" className="font-medium cursor-pointer">
                        Buscou ajuda psicológica/psiquiátrica anterior?
                      </Label>
                    </div>
                    {watch('comp_prev_help') && (
                      <Input
                        {...register('comp_prev_help_details')}
                        placeholder="Detalhes (quando, por quanto tempo, motivo do término)..."
                      />
                    )}
                  </div>

                  <div className="space-y-4 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="psych_meds"
                        checked={watch('comp_psych_meds')}
                        onCheckedChange={(v) => setValue('comp_psych_meds', !!v)}
                      />
                      <Label htmlFor="psych_meds" className="font-medium cursor-pointer">
                        Usa ou já usou medicação psiquiátrica?
                      </Label>
                    </div>
                    {watch('comp_psych_meds') && (
                      <Input
                        {...register('comp_psych_meds_details')}
                        placeholder="Quais medicações, dosagens e quando..."
                      />
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Infância e Desenvolvimento</Label>
                    <Textarea
                      {...register('histp_childhood')}
                      placeholder="Marcos de desenvolvimento, ambiente familiar na infância..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relações Familiares Atuais</Label>
                    <Textarea
                      {...register('histp_family')}
                      placeholder="Dinâmica familiar, conflitos, quem mora junto..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Histórico Acadêmico e Profissional</Label>
                    <Textarea
                      {...register('histp_academic')}
                      placeholder="Rendimento escolar, satisfação profissional, mudanças de carreira..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vida Social e Afetiva</Label>
                    <Textarea
                      {...register('histp_social')}
                      placeholder="Amizades, relacionamentos amorosos, hobbies..."
                    />
                  </div>

                  <div className="space-y-2 bg-rose-50 border border-rose-100 p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <Label className="text-rose-900 font-semibold">
                        Histórico de Trauma ou Abuso
                      </Label>
                      <span className="text-xs flex items-center text-rose-600 font-medium">
                        <Info className="w-3 h-3 mr-1" />
                        Paciente pode optar por não responder
                      </span>
                    </div>
                    <Textarea
                      {...register('histp_trauma')}
                      placeholder="Relatos de violência, perdas significativas, acidentes graves (opcional)..."
                      className="border-rose-200 focus-visible:ring-rose-500"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Condições Médicas / Doenças Crônicas</Label>
                    <Input
                      {...register('histm_diagnosis')}
                      placeholder="Ex: Hipertensão, Hipotireoidismo..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medicações de Uso Contínuo (Não Psiquiátricas)</Label>
                    <Input {...register('histm_meds')} placeholder="Ex: Losartana 50mg..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Cirurgias ou Internações Prévias</Label>
                    <Input
                      {...register('histm_hosp')}
                      placeholder="Ex: Apendicectomia em 2015..."
                    />
                  </div>

                  <div className="space-y-4 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="suicide"
                        checked={watch('histm_suicide')}
                        onCheckedChange={(v) => setValue('histm_suicide', !!v)}
                      />
                      <Label htmlFor="suicide" className="font-medium cursor-pointer text-red-600">
                        Histórico de Ideação ou Tentativa de Suicídio?
                      </Label>
                    </div>
                    {watch('histm_suicide') && (
                      <Input
                        {...register('histm_suicide_details')}
                        placeholder="Descreva o contexto, quando ocorreu e suporte atual..."
                        className="border-red-200 focus-visible:ring-red-500"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alergias</Label>
                      <Input
                        {...register('histm_allergies')}
                        placeholder="Ex: Nenhuma, Penicilina..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Histórico Familiar de Doenças Psiquiátricas</Label>
                      <Input {...register('histm_family')} placeholder="Ex: Mãe com Depressão..." />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Qualidade do Sono</Label>
                      <Select
                        value={watch('life_sleep')}
                        onValueChange={(v) => setValue('life_sleep', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bom/Reparador">Bom / Reparador</SelectItem>
                          <SelectItem value="Insônia inicial">Insônia inicial</SelectItem>
                          <SelectItem value="Insônia de manutenção">
                            Insônia de manutenção
                          </SelectItem>
                          <SelectItem value="Hipersônia">Hipersônia</SelectItem>
                          <SelectItem value="Irregular">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Padrão Alimentar</Label>
                      <Select
                        value={watch('life_diet')}
                        onValueChange={(v) => setValue('life_diet', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Adequado">Adequado</SelectItem>
                          <SelectItem value="Compulsão">Episódios de compulsão</SelectItem>
                          <SelectItem value="Restritivo">Restritivo / Falta de apetite</SelectItem>
                          <SelectItem value="Irregular">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Atividade Física</Label>
                    <Input
                      {...register('life_physical')}
                      placeholder="Ex: Sedentário, Caminhada 3x/semana..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Uso de Substâncias (Álcool, Tabaco, Outros)</Label>
                    <Input
                      {...register('life_substance')}
                      placeholder="Descreva frequência e quantidade..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rede de Apoio Atual</Label>
                    <Textarea
                      {...register('life_support')}
                      placeholder="Com quem o paciente pode contar em momentos de crise?"
                    />
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-amber-50 p-4 border border-amber-200 rounded-md mb-4">
                    <p className="text-amber-800 text-sm font-medium">
                      A impressão diagnóstica é mutável e serve como hipótese inicial para nortear o
                      plano de tratamento.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CID-10 Principal (Busca)</Label>
                      <Input
                        list="cid-list"
                        {...register('diag_cid_primary')}
                        placeholder="Ex: F32.0, F41.1..."
                      />
                      <datalist id="cid-list">
                        <option value="F32.0 - Transtorno depressivo leve" />
                        <option value="F32.1 - Transtorno depressivo moderado" />
                        <option value="F32.2 - Transtorno depressivo grave sem sintomas psicóticos" />
                        <option value="F41.0 - Transtorno de pânico" />
                        <option value="F41.1 - Ansiedade generalizada" />
                        <option value="F41.2 - Transtorno misto ansioso e depressivo" />
                        <option value="F43.1 - Transtorno de estresse pós-traumático" />
                        <option value="F90.0 - TDAH" />
                        <option value="F42 - Transtorno obsessivo-compulsivo" />
                        <option value="Z73.3 - Estresse (Burnout)" />
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <Label>CID-10 Secundário (Opcional)</Label>
                      <Input
                        list="cid-list"
                        {...register('diag_cid_secondary')}
                        placeholder="Ex: Z73.3..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações Clínicas Adicionais</Label>
                    <Textarea
                      {...register('diag_obs')}
                      placeholder="Postura do paciente na entrevista, nível de insight, afeto..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Conduta e Plano Terapêutico Proposto</Label>
                    <Textarea
                      {...register('diag_approach')}
                      placeholder="Frequência das sessões, objetivos iniciais, encaminhamentos necessários..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </form>
          </FormProvider>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between sm:justify-between w-full">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" type="button" onClick={handlePrev}>
                Anterior
              </Button>
            )}
            {step < 6 ? (
              <Button type="button" onClick={handleNext}>
                Próximo Passo
              </Button>
            ) : (
              <Button type="submit" form="anamnesis-form" disabled={loading}>
                {loading
                  ? 'Salvando...'
                  : existingAnamnesis
                    ? 'Salvar Alterações'
                    : 'Concluir Anamnese'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
