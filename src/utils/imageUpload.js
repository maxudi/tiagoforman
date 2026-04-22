import { supabase } from '../lib/supabase'

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param {File} file - Arquivo de imagem
 * @param {string} bucket - Nome do bucket ('avatars', 'products', etc)
 * @param {string} folder - Pasta dentro do bucket
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadImage(file, bucket = 'images', folder = '') {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem')
    }

    // Validar tamanho (máximo 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      throw new Error('A imagem deve ter no máximo 2MB')
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    throw error
  }
}

/**
 * Remove uma imagem do Supabase Storage
 * @param {string} path - Caminho do arquivo no storage
 * @param {string} bucket - Nome do bucket
 */
export async function deleteImage(path, bucket = 'images') {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar imagem:', error)
    throw error
  }
}
