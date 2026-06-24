import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default function StatisticalAnalysis() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="bg-yellow-50 border-yellow-200">
        <Info className="w-5 h-5 text-yellow-600" />
        <AlertTitle className="text-yellow-800 font-bold">
          Aviso sobre o módulo Estatístico
        </AlertTitle>
        <AlertDescription className="text-yellow-700 mt-1">
          Análise descritiva apenas. Para testes inferenciais e correlações avançadas, exporte os
          dados anonimizados e utilize um software especializado (SPSS, JASP, R).
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Média de Sessões/Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-700">12.4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Mediana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">10.0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Desvio Padrão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-indigo-700">4.2</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Taxa de Desfecho (Outcomes Clínicos)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-full flex rounded-md overflow-hidden bg-gray-100 shadow-inner">
            <div
              className="h-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: '60%' }}
              title="Alta: 60%"
            >
              60%
            </div>
            <div
              className="h-full bg-amber-400 flex items-center justify-center text-amber-900 text-xs font-bold"
              style={{ width: '25%' }}
              title="Transferência: 25%"
            >
              25%
            </div>
            <div
              className="h-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: '15%' }}
              title="Abandono: 15%"
            >
              15%
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-teal-500 rounded-sm" /> Alta Clínica
            </span>
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-400 rounded-sm" /> Transferência ou Encaminhamento
            </span>
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-sm" /> Abandono de Tratamento
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
