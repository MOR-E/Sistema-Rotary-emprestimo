"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      "pessoa",
      [
        {
          nome: "João Silva",
          telefone1: "+55 11 98765-4321",
          telefone2: "+55 11 98765-4000",
          cep: "01001-000",
          rua: "Praça da Sé",
          bairro: "Sé",
          complemento: "Apto 101",
          numero: "10",
          cpf: "130.256.096-48",
          rg: "12.345.678-9",
          createdAt: now,
          updatedAt: now,
        },
        {
          nome: "Maria Oliveira",
          telefone1: "+55 11 97654-3210",
          telefone2: null,
          cep: "20010-000",
          rua: "Rua Primeiro de Março",
          bairro: "Centro",
          complemento: "",
          numero: "50",
          cpf: "138.345.735-23",
          rg: "98.765.432-1",
          createdAt: now,
          updatedAt: now,
        },
        {
          nome: "Carlos Pereira",
          telefone1: "+55 11 96543-2109",
          telefone2: "+55 11 96543-2108",
          cep: "30110-000",
          rua: "Avenida Afonso Pena",
          bairro: "Centro",
          complemento: "Sala 202",
          numero: "100",
          cpf: "068.481.105-74",
          rg: "23.456.789-0",
          createdAt: now,
          updatedAt: now,
        },
        {
          nome: "Ana Souza",
          telefone1: "+55 11 95432-1098",
          telefone2: null,
          cep: "40010-000",
          rua: "Rua Chile",
          bairro: "Centro",
          complemento: "Casa",
          numero: "5",
          cpf: "167.597.603-10",
          rg: "34.567.890-1",
          createdAt: now,
          updatedAt: now,
        },
        {
          nome: "Pedro Gomes",
          telefone1: "+55 11 94321-0987",
          telefone2: "+55 11 94321-0986",
          cep: "50010-000",
          rua: "Rua Aurora",
          bairro: "Boa Vista",
          complemento: "Bloco B",
          numero: "25",
          cpf: "176.435.144-45",
          rg: "45.678.901-2",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // remove todas as pessoas inseridas acima
    await queryInterface.bulkDelete(
      "pessoa",
      {
        cpf: [
          "130.256.096-48",
          "138.345.735-23",
          "068.481.105-74",
          "167.597.603-10",
          "176.435.144-45",
        ],
      },
      {}
    );
  },
};
