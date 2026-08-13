# Plano: Melhorias de Checkout e Gestão de Produto

O sistema será atualizado para permitir configurações granulares por produto, aumentando a conversão no checkout através de prova social (depoimentos), senso de urgência (stock e mensagens) e atividade recente simulada/real.

## Alterações Técnicas

### 1. Banco de Dados (Supabase)
- **Produtos:** Adição de colunas para `show_stock_warning`, `stock_urgency_message`, `continue_selling_no_stock`, `show_recent_activity`, `recent_activity_frequency` e `testimonials` (JSONB).
- **Trigger de Stock:** Implementação de lógica no servidor para decrementar stock automaticamente ao criar uma encomenda e bloquear vendas se o stock acabar (conforme configuração).

### 2. Dashboard de Gestão (`produtos.tsx`)
- Reorganização do formulário em secções semânticas:
    - **Informações:** Nome, Preço, Fotos, Descrição.
    - **Stock:** Quantidade, visibilidade do aviso, mensagem personalizada e opção de continuar vendendo sem stock.
    - **Depoimentos:** Interface para adicionar/remover/reordenar depoimentos com foto, nome, cidade e texto.
    - **Atividade Recente:** Toggle de ativação e ajuste de frequência.

### 3. Checkout (`checkout.$slug.tsx`)
- **Aviso de Stock:** Exibição dinâmica baseada no stock real e visibilidade configurada.
- **Carrossel de Depoimentos:** Novo componente profissional (mobile-first com swipe) posicionado estrategicamente antes das informações de confiança.
- **Atividade Recente:** Notificação flutuante discreta que alterna entre nomes comuns e cidades permitidas para o produto.
- **Ordem dos Elementos:** Reestruturação do layout para maximizar a conversão seguindo a ordem sugerida.

### 4. Lógica de Atividade
- Utilização das cidades configuradas na "Disponibilidade" do produto.
- Alternância entre dados reais (encomendas recentes) e simulação visual (nomes comuns) para manter o checkout sempre "vivo".

## Experiência do Utilizador (UX)
- **Mobile:** Foco total em evitar que notificações tapem elementos vitais.
- **Urgência Real:** O stock mostrado é sempre o valor real guardado na base de dados.
- **Personalização:** Cada produto terá sua própria "alma" de vendas, permitindo testar diferentes abordagens de copy e prova social.

## Segurança e Performance
- Proteção contra stock negativo via trigger SQL.
- Carregamento otimizado de depoimentos e imagens.
- Respeito às Safe Areas do iPhone para as notificações flutuantes.
