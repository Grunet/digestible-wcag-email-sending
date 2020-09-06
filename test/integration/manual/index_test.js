require("dotenv").config({
  path: require("find-config")(".env", { cwd: __dirname }),
});

const { sendEmailsToRecipients } = require("../../../dist/index.js");

async function test_sendEmailsToRecipients() {
  const {
    recipientsRetrieval,
    emailClientFactory,
  } = require("./harness_options.json");

  const inputs = {
    dependencies: {
      getSubscribers: recipientsRetrieval.useMocks
        ? function () {
            return recipientsRetrieval.mockSubscriberData;
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
        sendOnly: process.env.DWCAG_APIKEYS_SENDGRID_SENDONLY,
      },
    },
    emails: {
      sender: process.env.DWCAG_EMAILS_SENDER,
    },
  };

  await sendEmailsToRecipients(inputs);
}

const __sendRedirectionOptions = {
  console: __sendToConsole,
};

function __sendToConsole(msgDataToSend) {
  const { html, ...rest } = msgDataToSend;

  console.log(JSON.stringify(rest, null, 4));
}

module.exports = {
  test_sendEmailsToRecipients: test_sendEmailsToRecipients,
};
