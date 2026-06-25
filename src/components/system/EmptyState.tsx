import React from 'react'
import { Search, Calendar, BarChart2, UserSearch } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export type EmptyStateContext = 'pacientes' | 'sessoes' | 'relatorios' | 'resultados' | 'custom'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  context?: EmptyStateContext
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  illustration?: React.ReactNode
}

export function EmptyState({
  context = 'resultados',
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
  ...props
}: EmptyStateProps) {
  const getContextContent = () => {
    switch (context) {
      case 'pacientes':
        return {
          icon: <UserSearch className="w-16 h-16 text-primary" strokeWidth={1.5} />,
          defaultTitle: 'Nenhum paciente encontrado',
          defaultDesc:
            'Você ainda não tem pacientes cadastrados ou a busca não retornou resultados.',
        }
      case 'sessoes':
        return {
          icon: <Calendar className="w-16 h-16 text-primary" strokeWidth={1.5} />,
          defaultTitle: 'Nenhuma sessão agendada',
          defaultDesc: 'Sua agenda está livre. Adicione novas sessões para começar.',
        }
      case 'relatorios':
        return {
          icon: <BarChart2 className="w-16 h-16 text-primary" strokeWidth={1.5} />,
          defaultTitle: 'Nenhum relatório disponível',
          defaultDesc: 'Ainda não há dados suficientes para gerar relatórios.',
        }
      case 'resultados':
      default:
        return {
          icon: <Search className="w-16 h-16 text-primary" strokeWidth={1.5} />,
          defaultTitle: 'Nenhum resultado',
          defaultDesc: 'Sua busca não encontrou nenhum item correspondente.',
        }
      case 'custom':
        return {
          icon: (
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="32"
                cy="32"
                r="30"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <line x1="20" y1="32" x2="44" y2="32" stroke="var(--color-primary)" strokeWidth="2" />
            </svg>
          ),
          defaultTitle: 'Sem conteúdo',
          defaultDesc: 'Não há dados para exibir no momento.',
        }
    }
  }

  const content = getContextContent()
  const displayTitle = title || content.defaultTitle
  const displayDesc = description || content.defaultDesc

  const defaultIllustration = (
    <div className="relative flex items-center justify-center w-[120px] h-[120px] rounded-full bg-primary-light mb-6">
      {content.icon}
    </div>
  )

  const finalIllustration = illustration || defaultIllustration

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center animate-page-enter w-full',
        className,
      )}
      {...props}
    >
      {finalIllustration}
      <h3 className="text-[18px] font-semibold text-text-primary mb-2">{displayTitle}</h3>
      <p className="text-[15px] text-text-secondary max-w-sm mb-6">{displayDesc}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
