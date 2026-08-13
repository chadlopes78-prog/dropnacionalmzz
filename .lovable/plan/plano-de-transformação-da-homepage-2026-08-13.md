# Plano de Transformação da Homepage

Remover a listagem direta de produtos da página inicial para criar um portal profissional de apresentação da plataforma "Drop Nacional Moçambique", focado em conversão de novos parceiros e credibilidade institucional.

## Alterações Propostas

### 🎨 UI & Design (Frontend)

- **Remoção da Listagem de Produtos**: Eliminar a secção "Destaques da Semana" e a query associada em `src/routes/index.tsx`.
- **Hero Section Premium**: Manter e expandir a Hero com foco na proposta de valor: "A plataforma nº 1 para Drop Nacional em Moçambique".
- **Novas Secções Institucionais**:
  - **Como Funciona para Lojistas**: Passo a passo de como vender produtos sem ter stock próprio.
  - **Números da Rede**: Estatísticas simuladas ou reais de encomendas e estafetas ativos.
  - **Chamada para Ação (CTA)**: Focar o botão principal em "Começar a Vender" (levar para /auth ou contacto).
- **Rodapé Profissional**: Expandir links institucionais e selos de confiança.

### 🗄️ Estrutura de Rotas

- A listagem de produtos deixa de ser a home. Os produtos individuais continuam acessíveis via `/checkout/$slug`.
- A homepage passa a ser uma Landing Page institucional/B2B.

## Detalhes Técnicos

- Remoção do hook `useQuery` de produtos em `StoreHome`.
- Limpeza de imports não utilizados (`formatMT`, `supabase`, `Skeleton`).
- Substituição da grid de produtos por componentes de benefícios e testemunhos de sucesso da rede.
- Ajuste dos links de navegação para focar no ecossistema da plataforma.
