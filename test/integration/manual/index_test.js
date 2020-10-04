const { sendEmailsToRecipients } = require("../../../dist/index.js");

(async function test_sendEmailsToRecipients() {
  const {
    inputs: { sendGridApiKey, senderEmail, currentSelectionServerURL },
    recipientsRetrieval,
    templateRetrieval,
    emailClientFactory,
  } = require("./harness_options.json");

  const inputs = {
    dependencies: {
      getSubscribers: recipientsRetrieval.useMocks
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
        send: emailClientFactory.useMocks
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
    emails: {
      sender: senderEmail,
    },
    urls: {
      currentSelectionServer: currentSelectionServerURL,
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
