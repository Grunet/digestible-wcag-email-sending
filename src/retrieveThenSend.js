async function retrieveThenSend(dependencies) {
  const { getRecipients, getTemplate, sendEmail } = dependencies;

  try {
    const [{ html }, { recipients }] = await Promise.all([
      getTemplate(),
      getRecipients(),
    ]);

    const recipientList = Array.from(recipients);
    const msgDataList = recipientList
      .map((recipient) => {
        return {
          to: recipient["emailAddress"],
          html: html,
        };
      });

    const emailSendingOutcomes = await Promise.allSettled(
      msgDataList
        .map((msgData) => {
          return sendEmail(msgData);
        }),
    );

    emailSendingOutcomes.forEach(function (outcome, index) {
      if (outcome.status === "rejected") {
        console.error(
          `Unhandled error in sending email`,
          `\n`,
          outcome.reason,
          `\n`,
          `Additional context: `,
          msgDataList[index],
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
