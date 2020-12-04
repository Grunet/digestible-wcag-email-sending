const { getRecipients } = require("./recipientsRetrieval.js");
const { getTemplate } = require("./templateRetrieval.js");
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
    credentials: {
      cognito: { contactsApiAuth: cognitoCredsForContactsAPI },
    },
    emails: { sender },
    ids: {
      cognito: { contactsApiAuth: cognitoIdsForContactsAPI },
    },
    urls: {
      currentSelectionServer: currentSelectionURL,
      contactsApi: contactsApiURL,
    },
  } = inputs;

  const sesStaticSettings = {
    fromEmail: sender,
    fromName: "WCAG of the Day",
  };

  const sesClient = createEmailClient(EmailClients.SES, sesStaticSettings);
  const sendEmailViaSES = sesClient.send.bind(sesClient);

  const staticSettings = {
    apiKey: sendOnlyApiKey,
    fromEmail: sender,
    fromName: "WCAG of the Day",
  };

  const sendGridClient = createEmailClient(
    EmailClients.SendGrid,
    staticSettings
  );
  const sendEmailViaSendGrid = sendGridClient.send.bind(sendGridClient);

  try {
    await retrieveThenSend({
      getRecipients: async function () {
        return await getRecipients({
          dependencies: inputs?.dependencies,
          auth: {
            credentials: cognitoCredsForContactsAPI,
            identifiers: cognitoIdsForContactsAPI,
          },
          path: contactsApiURL,
        });
      },
      getTemplate: async function () {
        return await getTemplate({
          dependencies: inputs?.dependencies,
          path: currentSelectionURL,
        });
      },
      sendEmail: async function (msgData) {
        try {
          await sendEmailViaSES({
            dependencies: inputs?.dependencies,
            msgData: msgData,
          });
        } catch (error) {
          console.error(error);

          await sendEmailViaSendGrid({
            dependencies: inputs?.dependencies,
            msgData: msgData,
          });
        }
      },
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  sendEmailsToRecipients: sendEmailsToRecipients,
};
