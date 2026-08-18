# 🍷 TELES ADEGA DELIVERY

Sistema moderno de delivery e e-commerce em tempo real para adegas e conveniências, com painel administrativo completo (Kanban de pedidos, gestão de produtos & estoque, fechamento de caixa para motoboys e controle de clientes com fiado).

---

## ⚡ Stack Tecnológica

- **Frontend / Framework:** [Next.js 14 (App Router)](https://nextjs.org/) + TypeScript + React 18
- **Estilização:** Tailwind CSS (Dark Mode & Gold Palette: `#0D0D0D`, `#161616`, `#262626`, `#F59E0B`)
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (com persistência local e seletores atômicos reativos)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Realtime WebSockets, Storage)
- **Validação & Formulários:** [Zod](https://zod.dev/) + React Hook Form
- **Ícones:** [Lucide React](https://lucide.dev/)

---

## 🚀 Funcionalidades

### 🛍️ Vitrine & E-commerce (Storefront)
- Catálogo responsivo com filtros por categorias e badges de destaque / estoque crítico.
- Sacola de compras reativa com barra flutuante mobile e drawer lateral.
- Fluxo de Checkout rápido com busca automática de endereço por CEP (ViaCEP).
- Formas de pagamento: Pix, Dinheiro (com cálculo de troco) e Fiado (com validação de limite).
- Acompanhamento do pedido em tempo real com código de entrega de 4 dígitos.

### 📊 Painel Administrativo (Admin)
- **Kanban em Tempo Real:** Gestão de pedidos com alerta sonoro instantâneo para novas compras.
- **Gestão de Estoque & Produtos:**
  - Métricas rápidas no topo (Total, Estoque Baixo, Ativos).
  - Visualização híbrida (Cards touch-friendly no mobile com botões `[-]` e `[+]` de 44x44px / Tabela completa no desktop).
  - Modal de cadastro e edição com upload de imagens para o Supabase Storage.
  - Alerta de confirmação seguro para exclusão física ou soft delete (inativação).
- **Entregas & Motoboys:** Atribuição de pedidos e rotas.
- **Fechamento de Caixa:** Acerto diário por motoboy e por modalidade de pagamento.
- **Gestão de Clientes & Fiado:** Cadastro de clientes com histórico de fiado e limite de crédito.

---

## 🛠️ Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/petragliia/teles-adega-delivery.git
cd teles-adega-delivery
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz baseado no `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 4. Executar em modo de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` para a vitrine e `http://localhost:3000/admin/produtos` para a gestão administrativa.

---

## 📦 Build de Produção

```bash
npm run build
npm run start
```
