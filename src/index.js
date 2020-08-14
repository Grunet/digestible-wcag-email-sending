const { getRecipients } = require("./recipientsRetrieval.js");
const { getTemplateAtRandom } = require("./templateRetrieval.js");
const {
  createEmailClient,
  Clients: EmailClients,
} = require("./emailClientFactory.js");
const { retrieveThenSend } = require("./retrieveThenSend.js");

async function sendEmailsToRecipients(inputs) {
  const {
apiKeys: {
      sendGrid: { sendOnly: sendOnlyApiKey },
    },
    emails: { sender },
  } = inputs;

  const staticSettings = {
    apiKey: sendOnlyApiKey,
    from: sender,
  };

  const sendGridClient = createEmailClient(
    EmailClients.SendGrid,
    staticSettings,
  );
  const sendEmailViaSendGrid = sendGridClient.send.bind(sendGridClient);

  try {
    await retrieveThenSend({
      getRecipients: getRecipients,
      getTemplate: getTemplateAtRandom,
      sendEmail: sendEmailViaSendGrid,
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  sendEmailsToRecipients: sendEmailsToRecipients,
};
