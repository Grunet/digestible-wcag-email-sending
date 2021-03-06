const { sendEmailsToRecipients } = require("../../../dist/index.js");

test("Calls the primary sending provider's API to send an email", async () => {
  //ARRANGE
  const inputs = __setupDefaultInputs();

  //ACT
  await sendEmailsToRecipients(inputs);

  //ASSERT
  expect(inputs.dependencies.ses.sendEmail).toHaveBeenCalledTimes(1);
});

test("Calls the fallback sending provider's API to send an email after the primary's API failed to", async () => {
  //ARRANGE
  const inputs = __setupDefaultInputs();
  inputs.dependencies.ses.sendEmail = jest
    .fn()
    .mockRejectedValue(
      Error("Simulated SES sending error - i.e. this was hit on purpose")
    );

  //ACT
  await sendEmailsToRecipients(inputs);

  //ASSERT
  expect(inputs.dependencies.ses.sendEmail).toHaveBeenCalledTimes(1);
  expect(inputs.dependencies.sendGrid.send).toHaveBeenCalledTimes(1);
});

test("Doesn't send any emails if the sender's email isn't provided", async () => {
  //ARRANGE
  const inputs = __setupDefaultInputs();
  inputs.emails.sender = undefined;

  //ACT
  await sendEmailsToRecipients(inputs);

  //ASSERT
  expect(inputs.dependencies.ses.sendEmail).toHaveBeenCalledTimes(0);
  expect(inputs.dependencies.sendGrid.send).toHaveBeenCalledTimes(0);
});

function __setupDefaultInputs() {
  return {
    dependencies: {
      tryGetAuthToken: jest.fn(),
      getSubscribers: jest.fn().mockReturnValue({
        subscribers: [
          {
            email: "recipientAddress@example.com",
          },
        ],
      }),
      getTemplateData: jest.fn().mockReturnValue({
        html: "<div>Email Content</div>",
        plainText: "Email Content",
        subject: "Email Subject",
      }),
      ses: {
        sendEmail: jest.fn(),
      },
      sendGrid: {
        send: jest.fn(),
      },
    },
    apiKeys: {
      sendGrid: { sendOnly: "SG.unused" },
    },
    credentials: {
      cognito: {
        contactsApiAuth: {
          username: "unused",
          password: "unused",
        },
      },
    },
    emails: {
      sender: "senderAddress@example.com",
    },
    ids: {
      cognito: {
        contactsApiAuth: {
          appClientId: "unused",
          userPoolId: "unused",
        },
      },
    },
    urls: {
      currentSelectionServer: "unused",
      contactsApi: "unused",
    },
  };
}
