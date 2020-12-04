const SendGrid = "SendGrid";
const SES = "SES";

const supportedClients = {
  [SendGrid]: SendGrid,
  [SES]: SES,
};

function createEmailClient(clientId, defaultSettings) {
  if (!supportedClients.hasOwnProperty(clientId)) {
    throw new Error(
      `Unrecognized client id passed to factory: ${clientId.toString()}`
    );
  }

  switch (clientId) {
    case SendGrid:
      if (!defaultSettings.hasOwnProperty("apiKey")) {
        throw new Error(
          "Required API key is missing from the passed SendGrid default settings"
        );
      }

      return new SendGridAdapter(defaultSettings);

    case SES:
      return new SESAdapter(defaultSettings);

    default:
      throw new Error(`${clientId}'s adapter has not been implemented yet`);
  }
}

class SendGridAdapter {
  constructor(defaults) {
    this.__sgMail = require("@sendgrid/mail");
    this.__sgMail.setApiKey(defaults["apiKey"]);

    this.__defaultSettings = { ...defaults }; //Shallow copy
  }

  async send(inputs) {
    const send =
      inputs?.dependencies?.sendGrid?.send ??
      this.__sgMail.send.bind(this.__sgMail);

    const { msgData } = inputs;
    const msgDataWithDefaults = Object.assign(
      { ...this.__defaultSettings },
      msgData
    ); //Shallow copy

    const {
      to,
      fromEmail,
      fromName,
      subject,
      html,
      text,
    } = msgDataWithDefaults;

    const msgDataToSend = {
      to: to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: subject,
      html: html,
      text: text,
    };

    const flattenedMsgDataToSend = require("flat")(msgDataToSend);
    for (const [key, value] of Object.entries(flattenedMsgDataToSend)) {
      if (!value) {
        throw new Error(
          `"${key}" is missing from the inputs to the SendGrid mail sending api`
        );
      }
    }

    try {
      await send(msgDataToSend);
    } catch (error) {
      console.error(error);
      console.error(error?.response?.body);

      throw error;
    }
  }
}

class SESAdapter {
  constructor(defaults) {
    const AWS = require("aws-sdk");
    this.__SES = new AWS.SES();

    this.__defaultSettings = { ...defaults }; //Shallow copy
  }

  async send(inputs) {
    const sendEmail =
      inputs?.dependencies?.ses?.sendEmail ??
      (async (params) => {
        return this.__SES.sendEmail(params).promise();
      });

    const { msgData } = inputs;
    const msgDataWithDefaults = Object.assign(
      { ...this.__defaultSettings },
      msgData
    ); //Shallow copy

    const {
      to,
      fromEmail,
      fromName,
      subject,
      html,
      text,
    } = msgDataWithDefaults;

    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
          Text: {
            Charset: "UTF-8",
            Data: text,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: `${fromName} <${fromEmail}>`,
    };

    try {
      await sendEmail(params);
    } catch (error) {
      console.error(error, error.stack);

      throw error;
    }
  }
}

module.exports = {
  Clients: supportedClients,
  createEmailClient: createEmailClient,
};
