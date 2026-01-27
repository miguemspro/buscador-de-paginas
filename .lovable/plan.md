
# Plano: Proteger Página Principal com Autenticação

## Problema Identificado

A rota principal `/` (página de upload de Salesforce) está **completamente desprotegida**. Qualquer pessoa pode acessar em uma guia anônima sem fazer login, como demonstrado no screenshot.

### Situação Atual das Rotas:

| Rota | Proteção | Status |
|------|----------|--------|
| `/` | Nenhuma | VULNERÁVEL |
| `/dashboard` | Nenhuma | VULNERÁVEL |
| `/admin/login` | Pública (correto) | OK |
| `/admin/*` | ProtectedRoute | OK |

## Solução Proposta

Aplicar o componente `ProtectedRoute` em **todas** as rotas que requerem autenticação.

### Alterações no arquivo `src/App.tsx`:

```typescript
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App - PROTEGIDA */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } 
          />
          
          {/* Dashboard de Métricas - PROTEGIDA */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MetricsDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Login - Pública */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/cases" replace />} />
            <Route path="cases" element={<CasesPage />} />
            <Route path="solucoes" element={<SolucoesPage />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Fluxo Após a Correção

```text
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE ACESSO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Usuário acessa "/"                                         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐                                        │
│  │ ProtectedRoute  │                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│     ┌─────┴─────┐                                           │
│     ▼           ▼                                           │
│  Logado?    Não logado?                                     │
│     │           │                                           │
│     ▼           ▼                                           │
│  Mostra      Redireciona para                               │
│  Index       /admin/login                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

| Rota | Antes | Depois |
|------|-------|--------|
| `/` | Acessível sem login | Requer login |
| `/dashboard` | Acessível sem login | Requer login |
| `/admin/login` | Pública | Pública (mantém) |
| `/admin/*` | Requer login | Requer login |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Envolver rotas `/` e `/dashboard` com `ProtectedRoute` |

## Seção Técnica

A correção é simples e envolve apenas o arquivo `src/App.tsx`:

1. A rota `/` será envolvida pelo componente `ProtectedRoute`
2. A rota `/dashboard` será envolvida pelo componente `ProtectedRoute`
3. Quando um usuário não autenticado acessar qualquer dessas rotas, será automaticamente redirecionado para `/admin/login`
4. Após o login, o usuário será redirecionado de volta para a página que tentou acessar originalmente (usando o `state.from` do location)
