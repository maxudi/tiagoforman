# ⚠️ ERRO: supabaseUrl is required - SOLUÇÃO

## Problema
O site está mostrando página em branco e o erro no console:
```
Uncaught Error: supabaseUrl is required.
```

## Causa
O arquivo `.env` não vai para o Git (por segurança). As variáveis de ambiente precisam ser configuradas **diretamente no Easypanel**.

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Acessar Easypanel
1. Acesse: https://easypanel.io (ou seu painel)
2. Faça login
3. Selecione o projeto **tiagoforman**

### Passo 2: Adicionar Variáveis de Ambiente

Procure por uma dessas opções no menu:
- **Environment Variables**
- **Environment**
- **Env Variables**
- **Settings** → **Environment**

### Passo 3: Adicionar as 2 Variáveis

**Variável 1:**
```
Nome: VITE_SUPABASE_URL
Valor: https://ideal-supabase.yzqq8i.easypanel.host
```

**Variável 2:**
```
Nome: VITE_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

### Passo 4: Salvar e Redeploy

1. **Salve** as variáveis de ambiente
2. Procure por **"Redeploy"** ou **"Deploy"** ou **"Rebuild"**
3. Clique para fazer o redeploy
4. Aguarde o build terminar (1-3 minutos)

### Passo 5: Verificar

1. Acesse a URL do seu site
2. Aperte `Ctrl + Shift + R` para limpar cache
3. Abra o Console (F12)
4. Não deve aparecer mais o erro!

## 📝 Nota Importante

As variáveis de ambiente **NUNCA** devem ir para o Git por questões de segurança. Por isso, sempre que fizer deploy em uma plataforma nova, você precisa configurá-las manualmente no painel.

## ❓ Ainda com problemas?

Se após seguir todos os passos o erro persistir:

1. Verifique se as duas variáveis foram salvas corretamente
2. Confirme que fez o redeploy após adicionar as variáveis
3. Limpe o cache do navegador completamente
4. Teste em uma aba anônima
