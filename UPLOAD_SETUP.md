# Configuração de Upload de Imagens - Supabase Storage

## 🎯 O que foi implementado

Adicionei upload de imagens com **drag & drop** (arrastar e soltar) nas seguintes páginas:
- ✅ **Produtos** - imagem do produto
- ✅ **Funcionários** - foto do funcionário  
- ✅ **Atendentes** - foto do atendente

## 📋 Passo a Passo para Configurar

### 1. Acessar o Supabase

Acesse: https://ideal-supabase.yzqq8i.easypanel.host

### 2. Executar SQL para criar o bucket

No **SQL Editor**, execute o script `backend/storage_setup.sql`:

```sql
-- Criar bucket para imagens (se ainda não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens (apenas usuários autenticados)
CREATE POLICY "Usuários podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
);

-- Política para visualização pública
CREATE POLICY "Imagens são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Política para atualizar imagens
CREATE POLICY "Usuários podem atualizar suas imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Política para deletar imagens  
CREATE POLICY "Usuários podem deletar suas imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

### 3. Executar SQL para corrigir payments (se ainda não fez)

No **SQL Editor**, execute:

```sql
ALTER TABLE payments 
ALTER COLUMN customer_id DROP NOT NULL;
```

### 4. Testar Upload

1. Acesse qualquer uma das páginas: Produtos, Funcionários ou Atendentes
2. Clique em "Novo" ou edite um registro existente
3. Você verá uma área de upload com:
   - 📸 Ícone de imagem
   - Texto: "Arraste uma imagem ou clique para selecionar"
   - Formato aceito: PNG, JPG, GIF até 2MB

4. Faça o upload por:
   - **Arraste** uma imagem da sua área de trabalho para a área
   - **Clique** na área e selecione um arquivo

5. A imagem será:
   - Preview imediato
   - Upload automático para Supabase Storage
   - Salva no banco de dados quando clicar em "Salvar"

## 🗂️ Estrutura de Pastas no Storage

As imagens são organizadas por tipo:
```
images/
├── products/     → Imagens de produtos
└── avatars/      → Fotos de funcionários e atendentes
```

## ✨ Funcionalidades

- ✅ Drag & Drop (arrastar e soltar)
- ✅ Click para selecionar arquivo
- ✅ Preview instantâneo
- ✅ Validação de tipo (apenas imagens)
- ✅ Validação de tamanho (máximo 2MB)
- ✅ Upload automático para Supabase Storage
- ✅ Botão para remover imagem
- ✅ Loading state durante upload

## 🔧 Componentes Criados

1. **ImageUpload.jsx** - Componente de upload reutilizável
2. **imageUpload.js** - Helper com funções de upload/delete

## 📝 Notas

- As imagens antigas via URL continuam funcionando
- URLs públicas das imagens são geradas automaticamente
- Upload apenas funciona para usuários autenticados
- Storage é público para visualização (read)
