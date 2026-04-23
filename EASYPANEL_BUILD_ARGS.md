# Configuração de Build Arguments no Easypanel

## Problema
O Vite substitui variáveis `VITE_*` durante o **build** (compile-time), não em runtime. Por isso, apenas adicionar nas variáveis de ambiente não funciona.

## Solução

### Opção 1: Build Arguments no Easypanel

No Easypanel, você precisa configurar **Build Arguments** (não apenas Environment Variables):

1. Acesse seu projeto no Easypanel
2. Vá em **Settings** → **Build**
3. Procure por **Build Arguments** ou **Build Args**
4. Adicione:
   ```
   VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
   ```
5. Salve e **Redeploy**

### Opção 2: Build via GitHub Actions (Recomendado)

Se o Easypanel não tiver Build Arguments, use GitHub Actions para fazer o build:

1. O build acontece no GitHub (com secrets configurados)
2. Faz push da imagem Docker pronta
3. Easypanel só executa a imagem

### Opção 3: Runtime Configuration (Alternativa)

Se nenhuma das opções acima funcionar, posso criar um sistema que injeta as variáveis em runtime usando um script de inicialização.

## Verificação

Após configurar os Build Arguments:

1. Faça um **novo deploy** (não apenas restart)
2. O Easypanel vai buildar a imagem novamente
3. Durante o build, as variáveis estarão disponíveis
4. O Vite vai compilar o código com as URLs corretas

## Comandos de Build Manual (para testar localmente)

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://ideal-supabase.yzqq8i.easypanel.host \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE \
  -t tiagoforman .
```

## Diferença Importante

- **Environment Variables** (Variáveis de Ambiente): Disponíveis em RUNTIME (quando o container roda)
- **Build Arguments**: Disponíveis em BUILD TIME (quando o Docker constrói a imagem)

Para Vite, você precisa dos **Build Arguments**!
