const { body, validationResult } = require("express-validator");
const { cpf: cpfValidator } = require("cpf-cnpj-validator"); // biblioteca recomendada

const personCreateValidationRules = [
  body("nome")
    .notEmpty()
    .withMessage("O nome é obrigatório.")
    .matches(/^[A-Za-zÀ-ú]+(?:\s[A-Za-zÀ-ú]+)+$/)
    .withMessage("Digite um nome completo válido (sem números).")
    .isLength({ min: 3 })
    .withMessage("O nome deve ter pelo menos 3 caracteres."),

  body("rua").notEmpty().withMessage("A rua é obrigatória."),

  body("bairro").notEmpty().withMessage("O bairro é obrigatório."),

  body("complemento").optional(), // Remove a obrigatoriedade
  //.notEmpty()
  //.withMessage("O complemento é obrigatório."),

  body("numero")
    .optional() // Remove a obrigatoriedade
    //.notEmpty()
    //.withMessage("O número é obrigatório.")
    .isNumeric()
    .withMessage("O número deve conter apenas dígitos."),

  body("cpf")
    .notEmpty()
    .withMessage("O CPF é obrigatório.")
    .custom((value) => {
      if (!cpfValidator.isValid(value)) {
        throw new Error("CPF inválido.");
      }
      return true;
    }),

  body("rg")
    .notEmpty()
    .withMessage("O RG é obrigatório.")
    .matches(/^\d{7,9}$/)
    .withMessage("O RG deve ter entre 7 e 9 dígitos numéricos."),
];

const validatePersonCreate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  personCreateValidationRules,
  validatePersonCreate,
};
