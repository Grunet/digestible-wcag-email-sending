const Bottleneck = require("bottleneck");

const SENDING_RATE = 10; //per second. Slightly less than my current AWS SES limit. Generalize as needed.

async function retrieveThenSend(dependencies) {
  const { getRecipients, getTemplate, sendEmail } = dependencies;

  try {
    const [{ html, text, subject }, { recipients }] = await Promise.all([
      getTemplate(),
      getRecipients(),
    ]);

    const recipientList = Array.from(recipients);
    const msgDataList = recipientList.map((recipient) => {
      return {
        to: recipient["emailAddress"],
        html: html,
        text: text,
        subject: subject,
      };
    });

    const limiter = new Bottleneck({
      minTime: 1000 / SENDING_RATE,
    });

    const emailSendingOutcomes = await Promise.allSettled(
      msgDataList.map((msgData) => {
        return limiter.schedule(async () => {
          return await sendEmail(msgData);
        });
      })
    );

    emailSendingOutcomes.forEach(function (outcome, index) {
      if (outcome.status === "rejected") {
        console.error(
          `Unhandled error in sending email`,
          `\n`,
          outcome.reason,
          `\n`,
          `Additional context: `,
          msgDataList[index]
        );
      }
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  retrieveThenSend: retrieveThenSend,
};
