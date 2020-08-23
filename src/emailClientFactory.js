const SendGrid = "SendGrid";

const supportedClients = {
  [SendGrid]: SendGrid,
};

function createEmailClient(clientId, defaultSettings) {
  if (!supportedClients.hasOwnProperty(clientId)) {
    throw new Error(
      `Unrecognized client id passed to factory: ${clientId.toString()}`,
    );
  }

  switch (clientId) {
    case SendGrid:
      if (!defaultSettings.hasOwnProperty("apiKey")) {
        throw new Error(
          "Required API key is missing from the passed SendGrid default settings",
        );
      }

      return new SendGridAdapter(defaultSettings);
      break;
    default:
      throw new Error(`${clientId}'s adapter has not been implemented yet`);
      break;
  }
}

class SendGridAdapter {
  constructor(defaults) {
    this.__sgMail = require("@sendgrid/mail");
    this.__sgMail.setApiKey(defaults["apiKey"]);

    this.__defaultSettings = { ...defaults }; //Shallow copy
  }

  async send(msgData) {
    const msgDataWithDefaults = Object.assign(
      { ...this.__defaultSettings },
      msgData,
    ); //Shallow copy

    const { to, from, fromName, subject, html } = msgDataWithDefaults;

    const msgDataToSend = {
      to: to,
      from: {
        email: from,
        name: fromName,
      },
      subject: subject,
      html: html,
    };

    for (const [key, value] of Object.entries(msgDataToSend)) {
      if (!value) {
        throw new Error(
          `"${key}" is missing from the inputs to the SendGrid mail sending api`,
        );
      }
    }

    try {
      await this.__sgMail.send(msgDataToSend);
    } catch (error) {
      console.error(error);
      console.error(error?.response?.body);

      throw error;
    }
  }
}

module.exports = {
  Clients: supportedClients,
  createEmailClient: createEmailClient,
};
