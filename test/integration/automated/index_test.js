require("dotenv").config();

const { sendEmailsToRecipients } = require("../../../dist/index.js");

(async function () {
  await sendEmailsToRecipients();
})();
