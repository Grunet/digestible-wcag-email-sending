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
    this.__defaultsManager = new DefaultsManager(defaults);

    this.__sgMail = require("@sendgrid/mail");
    this.__sgMail.setApiKey(defaults["apiKey"]);
  }

  async send(inputs) {
    const send =
      inputs?.dependencies?.sendGrid?.send ??
      this.__sgMail.send.bind(this.__sgMail);

    const { msgData } = this.__defaultsManager.applyDefaultsToInputs(inputs);

    const {
      to,
      fromEmail,
      fromName,
      subject,
      html,
      text,
    } = __createValueValidationProxy(msgData);

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
    this.__defaultsManager = new DefaultsManager(defaults);

    const AWS = require("aws-sdk");
    this.__SES = new AWS.SES();
  }

  async send(inputs) {
    const sendEmail =
      inputs?.dependencies?.ses?.sendEmail ??
      (async (params) => {
        return this.__SES.sendEmail(params).promise();
      });

    const { msgData } = this.__defaultsManager.applyDefaultsToInputs(inputs);

    const {
      to,
      fromEmail,
      fromName,
      subject,
      html,
      text,
    } = __createValueValidationProxy(msgData);

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

class DefaultsManager {
  constructor(defaults) {
    this.__defaultSettings = { ...defaults }; //Shallow copy
  }

  applyDefaultsToInputs(inputs) {
    const { msgData, ...rest } = inputs; //Shallow copy

    const inputsWithDefaults = {
      msgData: Object.assign({ ...this.__defaultSettings }, msgData), //Shallow copy
      ...rest,
    };

    return inputsWithDefaults;
  }
}

function __createValueValidationProxy(obj) {
  return new Proxy(obj, valueValidationProxyHandler);
}

const valueValidationProxyHandler = {
  get: function (obj, prop) {
    const value = obj[prop];

    if (value === undefined) {
      throw new Error(`The value of ${prop} is undefined on ${obj}`);
    }

    return value;
  },
};

module.exports = {
  Clients: supportedClients,
  createEmailClient: createEmailClient,
};
