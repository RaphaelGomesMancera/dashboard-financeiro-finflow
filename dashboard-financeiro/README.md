# Finflow — Dashboard Financeiro

Aplicação de controle financeiro pessoal com **três telas navegáveis**, tema escuro moderno e gráficos interativos — construída em **HTML, CSS e JavaScript puro**, usando **Chart.js**.

## Telas

- **Visão geral** — cartões de resumo (receitas, despesas, saldo), gráfico de despesas por categoria e últimos lançamentos.
- **Transações** — formulário de cadastro de receitas/despesas e lista completa com filtro por tipo.
- **Relatórios** — categoria de maior gasto, ticket médio por despesa, gráfico de distribuição de despesas e comparativo receitas x despesas.

## Funcionalidades

- Cadastro de receitas e despesas (descrição, valor, categoria, data)
- Navegação entre telas sem recarregar a página (SPA)
- Gráficos de rosca e barras com **Chart.js**
- Filtro de transações por tipo
- Remoção de lançamentos
- Layout **responsivo**, com suporte a tema claro e escuro

## Estrutura do projeto

```
dashboard-financeiro/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Como executar

Basta abrir o arquivo `index.html` em qualquer navegador — não há dependências de back-end. Os lançamentos são salvos no `localStorage` do navegador, apenas para fins de demonstração.

## Tecnologias

- HTML5
- CSS3 (variáveis CSS, grid, animações)
- JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/)

## Observação

Este projeto é uma demonstração de front-end. Em uma aplicação real, os lançamentos seriam armazenados em um back-end com banco de dados e autenticação de usuário.
