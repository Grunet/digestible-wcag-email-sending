const { retrieveThenSend } = require("../../../src/retrieveThenSend.js");

let spies;

beforeEach(() => {
  spies = {
    console: {
      error: jest.spyOn(console, "error"),
    },
  };
});

afterEach(() => {
  jest.restoreAllMocks(); //Clears out spies in between tests
});

test("Sends emails to multiple recipients", async () => {
  //ARRANGE
  const getRecipients = jest.fn().mockReturnValue({
    recipients: new Set([
      {
        emailAddress: "first@example.org",
      },
      {
        emailAddress: "second@example.org",
      },
    ]),
  });
  const getTemplate = jest.fn().mockReturnValue({
    html: "<div>Email content</div>",
    subject: "Email subject",
  });
  const sendEmail = jest.fn();

  //ACT
  await retrieveThenSend({
    getRecipients: getRecipients,
    getTemplate: getTemplate,
    sendEmail: sendEmail,
  });

  //ASSERT
  expect(sendEmail).toHaveBeenCalledTimes(2);
});

test("Aborts email sending if error occurs while getting recipients", async () => {
  //ARRANGE
  const getRecipients = jest
    .fn()
    .mockRejectedValue(
      Error(
        "From the getRecipients failure mock - i.e. this was hit on purpose"
      )
    );
  const getTemplate = jest.fn().mockReturnValue({
    html: "<div>Email content</div>",
    subject: "Email subject",
  });
  const sendEmail = jest.fn();

  //ACT
  await retrieveThenSend({
    getRecipients: getRecipients,
    getTemplate: getTemplate,
    sendEmail: sendEmail,
  });

  //ASSERT
  expect(spies.console.error).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledTimes(0);
});

test("Sends emails to the rest of the recipients even if sending fails for some", async () => {
  //ARRANGE
  const getRecipients = jest.fn().mockReturnValue({
    recipients: new Set([
      {
        emailAddress: "first@example.org",
      },
      {
        emailAddress: "second@example.org",
      },
    ]),
  });
  const getTemplate = jest.fn().mockReturnValue({
    html: "<div>Email content</div>",
    subject: "Email subject",
  });

  const sendEmailSuccessfully = jest.fn();
  const sendEmail = jest
    .fn()
    .mockRejectedValueOnce(
      new Error(
        "From the sendEmail failure mock - i.e. this was hit on purpose"
      )
    )
    .mockImplementation(async () => {
      sendEmailSuccessfully();
    });

  //ACT
  await retrieveThenSend({
    getRecipients: getRecipients,
    getTemplate: getTemplate,
    sendEmail: sendEmail,
  });

  //ASSERT
  expect(spies.console.error).toHaveBeenCalledTimes(1);
  expect(sendEmailSuccessfully).toHaveBeenCalledTimes(2 - 1);
});
