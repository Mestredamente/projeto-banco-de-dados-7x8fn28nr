import { Badge } from '@/components/ui/badge'

export function AgendaLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs items-center p-2 bg-muted/30 rounded-md">
      <span className="font-medium text-muted-foreground mr-2">Legenda:</span>
      <Badge
        variant="outline"
        className="bg-blue-100 text-blue-800 border-blue-500 hover:bg-blue-100"
      >
        Presencial
      </Badge>
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 border-green-500 hover:bg-green-100"
      >
        Online
      </Badge>
      <Badge
        variant="outline"
        className="bg-orange-100 text-orange-800 border-orange-500 hover:bg-orange-100"
      >
        Extra
      </Badge>
      <Badge
        variant="outline"
        className="bg-red-100 text-red-800 border-red-500 line-through hover:bg-red-100"
      >
        Cancelada
      </Badge>
      <Badge
        variant="outline"
        className="bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-100"
      >
        Falta
      </Badge>
      <Badge variant="outline" className="bg-gray-800 text-white border-gray-900 hover:bg-gray-800">
        Bloqueado
      </Badge>
    </div>
  )
}
