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
  const getRecipients = jest
    .fn()
    .mockReturnValue(__createMockRecipientData({ numRecipients: 2 }));
  const getTemplate = jest.fn().mockReturnValue(__createMockTemplateData());
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
  const getTemplate = jest.fn().mockReturnValue(__createMockTemplateData());
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
  const getRecipients = jest
    .fn()
    .mockReturnValue(__createMockRecipientData({ numRecipients: 2 }));
  const getTemplate = jest.fn().mockReturnValue(__createMockTemplateData());

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

test("Sends at most 14 emails per second to avoid exceeding AWS SES rate limits", async () => {
  //ARRANGE
  const getRecipients = jest
    .fn()
    .mockReturnValue(__createMockRecipientData({ numRecipients: 15 }));
  const getTemplate = jest.fn().mockReturnValue(__createMockTemplateData());

  //This assumes that if this mock is called repeatedly in a loop, it will execute very quickly (<<1 sec) and break the rate limit
  const sendInstants = [];
  const sendEmail = jest.fn().mockImplementation(async () => {
    sendInstants.push(Date.now());
  });

  //ACT
  await retrieveThenSend({
    getRecipients: getRecipients,
    getTemplate: getTemplate,
    sendEmail: sendEmail,
  });

  //ASSERT
  const averageSendingRate =
    sendInstants.length /
    ((Math.max(...sendInstants) - Math.min(...sendInstants)) / 1000);

  expect(averageSendingRate).toBeLessThan(14); //per second
});

function __createMockRecipientData(options) {
  const { numRecipients } = options;

  return {
    recipients: new Set(
      Array.from({ length: numRecipients }, (v, i) => i).map((i) => ({
        emailAddress: `${i}@example.org`,
      }))
    ),
  };
}

function __createMockTemplateData() {
  return {
    html: "<div>Email content</div>",
    subject: "Email subject",
  };
}
