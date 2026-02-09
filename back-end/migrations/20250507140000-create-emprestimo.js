"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("emprestimo", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      dataEmprestimo: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      dataDevolucao: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pessoaId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "pessoa", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      requisitanteId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "usuario", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      usuarioDevolucaoId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "usuario", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      situacao: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("emprestimo");
  },
};
