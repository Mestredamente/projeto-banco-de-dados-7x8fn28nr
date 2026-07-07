const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const TARGET_SIZE = 400

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado (JPG, PNG, WebP)' }
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande (máx 5MB)' }
  }
  return { valid: true }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function resizeImage(file: File, size: number = TARGET_SIZE): Promise<File> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  const minDim = Math.min(img.width, img.height)
  const sx = (img.width - minDim) / 2
  const sy = (img.height - minDim) / 2
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      'image/webp',
      0.9,
    )
  })
  return new File([blob], 'profile-photo.webp', { type: 'image/webp' })
}
