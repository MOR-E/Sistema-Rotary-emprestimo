"use strict";
require("dotenv").config(); // carrega variáveis

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      "usuario",
      [
        {
          nome: process.env.ADMIN_NAME,
          telefone: process.env.ADMIN_PHONE,
          email: process.env.ADMIN_EMAIL,
          senha: process.env.ADMIN_PASSWORD,
          admin: process.env.ADMIN_ROLE,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "usuario",
      {
        email: process.env.ADMIN_EMAIL,
      },
      {}
    );
  },
};
