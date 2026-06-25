import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from './use-auth'

interface BrandingContextType {
  clinic: any
  loading: boolean
}

const BrandingContext = createContext<BrandingContextType>({ clinic: null, loading: true })

export const useBranding = () => useContext(BrandingContext)

// Funções utilitárias para manipulação de cores do Design System
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

function mixColors(color1: string, color2: string, weight: number) {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return color1
  const r = Math.round(rgb1.r * (1 - weight) + rgb2.r * weight)
  const g = Math.round(rgb1.g * (1 - weight) + rgb2.g * weight)
  const b = Math.round(rgb1.b * (1 - weight) + rgb2.b * weight)
  return rgbToHex(r, g, b)
}

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth()
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setClinic(null)
      setLoading(false)
      const root = document.documentElement
      root.style.removeProperty('--color-primary')
      root.style.removeProperty('--color-primary-hover')
      root.style.removeProperty('--color-primary-light')
      root.style.removeProperty('--color-secondary')
      root.style.removeProperty('--color-secondary-hover')
      return
    }

    const fetchBranding = async () => {
      try {
        let clinicId = null
        if (user.role === 'paciente') {
          const p = await pb.collection('patients').getFirstListItem(`profile="${user.id}"`)
          const rels = await pb.collection('patient_professionals').getList(1, 1, {
            filter: `patient = "${p.id}" && is_active = true && deleted_at = ""`,
          })
          if (rels.items.length > 0) clinicId = rels.items[0].clinic
        } else {
          const rels = await pb.collection('clinic_professionals').getList(1, 1, {
            filter: `professional = "${user.id}" && is_active = true && deleted_at = ""`,
          })
          if (rels.items.length > 0) clinicId = rels.items[0].clinic
        }

        if (clinicId) {
          const c = await pb.collection('clinics').getOne(clinicId)
          if (user.role === 'psicologo_autonomo') {
            setClinic(null)
          } else {
            setClinic(c)
          }
        } else {
          setClinic(null)
        }
      } catch (e) {
        setClinic(null)
      } finally {
        setLoading(false)
      }
    }
    fetchBranding()
  }, [user, isAuthenticated])

  useEffect(() => {
    const root = document.documentElement

    // Aplica os tokens do Design System baseados no perfil da clínica ativa
    if (clinic?.primary_color) {
      const p = clinic.primary_color
      root.style.setProperty('--color-primary', p)
      root.style.setProperty('--color-primary-hover', mixColors(p, '#000000', 0.2))
      root.style.setProperty('--color-primary-light', mixColors(p, '#FFFFFF', 0.85))
    } else {
      root.style.removeProperty('--color-primary')
      root.style.removeProperty('--color-primary-hover')
      root.style.removeProperty('--color-primary-light')
    }

    if (clinic?.secondary_color) {
      const s = clinic.secondary_color
      root.style.setProperty('--color-secondary', s)
      root.style.setProperty('--color-secondary-hover', mixColors(s, '#000000', 0.2))
    } else {
      root.style.removeProperty('--color-secondary')
      root.style.removeProperty('--color-secondary-hover')
    }
  }, [clinic])

  return React.createElement(BrandingContext.Provider, { value: { clinic, loading } }, children)
}
