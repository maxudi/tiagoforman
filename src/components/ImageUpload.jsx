import { useState, useRef } from 'react'
import { uploadImage } from '../utils/imageUpload'

export default function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  bucket = 'images',
  folder = '',
  label = 'Imagem'
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '')
  const fileInputRef = useRef(null)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileSelect = async (e) => {
    const files = e.target.files
    if (files && files[0]) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file) => {
    try {
      // Validação básica
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem')
        return
      }

      setIsUploading(true)

      // Preview local imediato
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      // Upload para Supabase Storage
      const { url } = await uploadImage(file, bucket, folder)
      
      // Atualizar com URL final
      setPreviewUrl(url)
      onImageUploaded(url)

      // Limpar preview local
      URL.revokeObjectURL(localPreview)
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload: ' + error.message)
      setPreviewUrl(currentImageUrl || '')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreviewUrl('')
    onImageUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        {label}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {previewUrl ? (
          <div className="relative p-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-400">
              {isUploading ? 'Enviando...' : 'Arraste uma imagem ou clique para selecionar'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF até 2MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
