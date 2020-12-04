const { sendEmailsToRecipients } = require("../../../dist/index.js");

(async function test_sendEmailsToRecipients() {
  const {
    inputs: {
      sendGridApiKey,
      senderEmail,
      currentSelectionServerURL,
      contactsApiInputs: {
        apiURL: contactsApiURL,
        cognitoInfo: { username, password, appClientId, userPoolId },
      },
    },
    recipientsRetrieval,
    templateRetrieval,
    emailClientFactory,
  } = require("./harness_options.json");

  const inputs = {
    dependencies: {
      tryGetAuthToken: recipientsRetrieval.useMocksFor.tryGetAuthToken
        ? function () {
            return "";
          }
        : undefined,
      getSubscribers: recipientsRetrieval.useMocksFor.getSubscribers
        ? function () {
            return recipientsRetrieval.mockSubscriberData;
          }
        : undefined,
      getTemplateData: templateRetrieval.useMocks
        ? function () {
            return templateRetrieval.mockTemplateData;
          }
        : undefined,
      sendGrid: {
        send: emailClientFactory.useMocksFor.sendGrid
          ? async function (msgDataToSend) {
              return Promise.all(
                emailClientFactory.outputRedirection.map((option) =>
                  __sendRedirectionOptions[option](msgDataToSend)
                )
              );
            }
          : undefined,
      },
      ses: {
        sendEmail: emailClientFactory.useMocksFor.ses
          ? async function (msgDataToSend) {
              return Promise.all(
                emailClientFactory.outputRedirection.map((option) =>
                  __sendRedirectionOptions[option](msgDataToSend)
                )
              );
            }
          : undefined,
      },
    },
    apiKeys: {
      sendGrid: {
        sendOnly: sendGridApiKey,
      },
    },
    credentials: {
      cognito: {
        contactsApiAuth: {
          username: username,
          password: password,
        },
      },
    },
    emails: {
      sender: senderEmail,
    },
    ids: {
      cognito: {
        contactsApiAuth: {
          appClientId: appClientId,
          userPoolId: userPoolId,
        },
      },
    },
    urls: {
      currentSelectionServer: currentSelectionServerURL,
      contactsApi: contactsApiURL,
    },
  };

  await sendEmailsToRecipients(inputs);
})();

const __sendRedirectionOptions = {
  console: __sendToConsole,
};

function __sendToConsole(msgDataToSend) {
  const { html, ...rest } = msgDataToSend;

  console.log(JSON.stringify(rest, null, 4));
}
