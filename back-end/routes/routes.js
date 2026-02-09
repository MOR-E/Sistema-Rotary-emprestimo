var express = require("express");
var router = express.Router();
var HomeController = require("../controllers/HomeController");
var UserController = require("../controllers/UserController");
var PersonController = require("../controllers/PersonController");
var ItemController = require("../controllers/ItemController");
const { accessTimer, verifyAdmin, injectEmail } = require("../middleware/Auth");
const LendingController = require("../controllers/LendingController");

//validators
const {
  userValidationRules,
  validateUser,
} = require("../middleware/UserValidator");
const {
  userEditValidationRules,
  validateUserEdit,
} = require("../middleware/UserValidator");
const {
  personCreateValidationRules,
  validatePersonCreate,
} = require("../middleware/PersonValidator");

// rotas de usuarios
router.get("/", (req, res) => res.send("API Rotary Empréstimos"));
router.get("/home", accessTimer, injectEmail, HomeController.index);
router.post(
  "/user",
  accessTimer,
  userValidationRules,
  validateUser,
  UserController.create
);
router.get("/user", accessTimer, injectEmail, UserController.index);

router.put(
  "/user",
  accessTimer,
  userEditValidationRules,
  validateUserEdit,
  UserController.edit
);

router.post("/recoverpassword", UserController.recoverPassword);
router.post("/changepassword", UserController.changePassword);
router.post("/login", UserController.login);

// rotas de pessoas
router.post(
  "/person",
  accessTimer,
  personCreateValidationRules,
  injectEmail,
  validatePersonCreate,
  PersonController.create
);

router.get("/person", accessTimer, injectEmail, PersonController.index);

router.put(
  "/person",
  accessTimer,
  personCreateValidationRules,
  validatePersonCreate,
  injectEmail,
  PersonController.edit
);

// rotas de itens
router.post("/item", accessTimer, injectEmail, ItemController.create);
router.post(
  "/itemPatrimony",
  accessTimer,
  injectEmail,
  ItemController.createItemPatrimonio
);
router.get("/item", accessTimer, injectEmail, ItemController.index);
router.get(
  "/itemPatrimony",
  accessTimer,
  injectEmail,
  ItemController.findItemPatrimony
);
router.put("/item", accessTimer, injectEmail, ItemController.edit);
router.put(
  "/itemPatrimony",
  accessTimer,
  injectEmail,
  ItemController.editItemPatrimony
);

// rotas de emprestimos
router.post(
  "/lending",
  accessTimer,
  injectEmail,
  LendingController.createLending
);
router.post(
  "/return",
  accessTimer,
  injectEmail,
  LendingController.createReturn
);
router.post(
  "/addItem",
  accessTimer,
  injectEmail,
  LendingController.addItemToAnExistingLoan
);

router.get("/lending", accessTimer, injectEmail, LendingController.index);
router.put("/lending", accessTimer, injectEmail, LendingController.edit);

module.exports = router;
