var knex = require("../database/connection");

const crypto = require("crypto");

class PasswordToken {
  async create(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + 3600000); // 1h

    await knex("usuario").where({ id: userId }).update({
      reset_token: token,
      reset_token_expires: expires_at,
    });

    return { status: true, token };
  }

  static async validate(token) {
    const user = await knex("usuario")
      .where({ reset_token: token })
      .andWhere("reset_token_expires", ">", new Date())
      .first();

    if (!user) return { status: false };
    return { status: true, user };
  }

  static async invalidate(userId) {
    await knex("usuario").where({ id: userId }).update({
      reset_token: null,
      reset_token_expires: null,
    });
  }
}

module.exports = PasswordToken;
