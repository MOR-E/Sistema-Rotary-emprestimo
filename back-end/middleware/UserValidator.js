// middlewares/userValidator.js
const { body, param, validationResult, query } = require("express-validator");

const userValidationRules = [
  body("nome")
    .notEmpty()
    .withMessage("O nome é obrigatório.")
    .isLength({ min: 3 })
    .withMessage("O nome deve ter pelo menos 3 caracteres."),

  body("telefone")
    .notEmpty()
    .withMessage("O telefone é obrigatório.")
    .isMobilePhone("pt-BR")
    .withMessage("O telefone deve ser válido."),

  body("email")
    .notEmpty()
    .withMessage("O e-mail é obrigatório.")
    .isEmail()
    .withMessage("O e-mail deve ser válido."),

  body("senha")
    .notEmpty()
    .withMessage("A senha é obrigatória.")
    .isLength({ min: 6 })
    .withMessage("A senha deve ter pelo menos 6 caracteres."),

  body("admin")
    .optional()
    .isBoolean()
    .withMessage("O campo admin deve ser verdadeiro ou falso."),
];

const validateUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const userEditValidationRules = [
  // Validação do ID vindo como parâmetro de rota
  query("id")
    .notEmpty()
    .withMessage("O ID é obrigatório na rota.")
    .isInt()
    .withMessage("O ID deve ser um número inteiro."),

  body("nome")
    .notEmpty()
    .withMessage("O nome é obrigatório.")
    .isLength({ min: 2 })
    .withMessage("O nome deve ter ao menos 2 caracteres."),

  body("telefone")
    .notEmpty()
    .withMessage("O telefone é obrigatório.")
    .isMobilePhone("pt-BR")
    .withMessage("O telefone deve ser válido."),

  body("email")
    .notEmpty()
    .withMessage("O email é obrigatório.")
    .isEmail()
    .withMessage("O email deve ser válido."),
];

const validateUserEdit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  userValidationRules,
  validateUser,
  userEditValidationRules,
  validateUserEdit,
};
