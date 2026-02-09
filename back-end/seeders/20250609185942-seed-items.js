"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      "item",
      [
        {
          nome: "Lápis",
          descricao: "Lápis HB para desenho",
          createdAt: now,
          updatedAt: now,
        },
        {
          nome: "Caderno",
          descricao: "Caderno A4, 100 folhas",
          createdAt: now,
          updatedAt: now,
        },
        {
          nome: "Borracha",
          descricao: "Borracha branca macia",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "item",
      {
        nome: ["Lápis", "Caderno", "Borracha"],
      },
      {}
    );
  },
};
