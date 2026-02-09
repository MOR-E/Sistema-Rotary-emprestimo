"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // cria o DB se não existir
    await queryInterface.sequelize.query(
      "CREATE DATABASE IF NOT EXISTS `sistema_inventario` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // opcionalmente, pode remover o DB
    await queryInterface.sequelize.query(
      "DROP DATABASE IF EXISTS `sistema_inventario`;"
    );
  },
};
