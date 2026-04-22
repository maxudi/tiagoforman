-- Criar bucket para imagens (se ainda não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens (apenas usuários autenticados da organização)
CREATE POLICY "Usuários podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
);

-- Política para permitir visualização de imagens (público)
CREATE POLICY "Imagens são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Política para permitir atualização de imagens (apenas usuários autenticados)
CREATE POLICY "Usuários podem atualizar suas imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Política para permitir exclusão de imagens (apenas usuários autenticados)
CREATE POLICY "Usuários podem deletar suas imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
