"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("emprestimo_item", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      emprestimoId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "emprestimo", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      id_item: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "item",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      id_item_patrimonio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "item_patrimonio",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      patrimonio: {
        type: Sequelize.STRING,
        allowNull: false,
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
      dataEmprestimo: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      dataDevolucao: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable("emprestimo_item");
  },
};
