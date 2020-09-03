require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { sendEmailsToRecipients } = require("../../../dist/index.js");

(async function () {
  const inputs = {
    apiKeys: {
      sendGrid: {
        sendOnly: process.env.DWCAG_APIKEYS_SENDGRID_SENDONLY,
      },
    },
    emails: {
      sender: process.env.DWCAG_EMAILS_SENDER,
    },
  };

  await sendEmailsToRecipients(inputs);
})();
