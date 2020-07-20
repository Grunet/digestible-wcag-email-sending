const { getRecipients } = require("./recipientsRetrieval.js");
const { getTemplateAtRandom } = require("./templateRetrieval.js");
const {
  createEmailClient,
  Clients: EmailClients,
} = require("./emailClientFactory.js");
const { retrieveThenSend } = require("./retrieveThenSend.js");

const staticSettings = {
  apiKey: process.env.DWCAG_APIKEYS_SENDGRID_SENDONLY,
  from: process.env.DWCAG_EMAILS_SENDER,
  subject: "WCAG Digest",
};

const sendGridClient = createEmailClient(EmailClients.SendGrid, staticSettings);
const sendEmailViaSendGrid = sendGridClient.send.bind(sendGridClient);

async function sendEmailsToRecipients() {
  try {
    await retrieveThenSend({
      getRecipients: getRecipients,
      getTemplate: getTemplateAtRandom,
      sendEmail: sendEmailViaSendGrid,
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  sendEmailsToRecipients: sendEmailsToRecipients,
};
