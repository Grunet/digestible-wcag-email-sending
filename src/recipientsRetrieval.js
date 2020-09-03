async function getRecipients(inputs) {
  const getSubscribers =
    inputs?.dependencies?.getSubscribers ??
    require("digestible-wcag-contact-management").getSubscribers;

  const { subscribers } = await getSubscribers();

  const recipients = Array.from(subscribers).map((accountObj) => {
    const { email: address, ...rest } = accountObj;
    const adaptedAccountObj = { emailAddress: address, ...rest };

    return adaptedAccountObj;
  });

  return {
    recipients: new Set(recipients),
  };
}

module.exports = {
  getRecipients: getRecipients,
};
