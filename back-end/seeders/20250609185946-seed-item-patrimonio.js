"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert(
      "item_patrimonio",
      [
        // três patrimônios para cada item (id_item 1, 2 e 3)
        { id_item: 1, patrimonio: "PATR-1001", createdAt: now, updatedAt: now },
        { id_item: 1, patrimonio: "PATR-1002", createdAt: now, updatedAt: now },
        { id_item: 1, patrimonio: "PATR-1003", createdAt: now, updatedAt: now },

        { id_item: 2, patrimonio: "PATR-2001", createdAt: now, updatedAt: now },
        { id_item: 2, patrimonio: "PATR-2002", createdAt: now, updatedAt: now },
        { id_item: 2, patrimonio: "PATR-2003", createdAt: now, updatedAt: now },

        { id_item: 3, patrimonio: "PATR-3001", createdAt: now, updatedAt: now },
        { id_item: 3, patrimonio: "PATR-3002", createdAt: now, updatedAt: now },
        { id_item: 3, patrimonio: "PATR-3003", createdAt: now, updatedAt: now },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("item_patrimonio", null, {});
  },
};
