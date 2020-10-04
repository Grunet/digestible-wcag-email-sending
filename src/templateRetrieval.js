const fetch = require("node-fetch");

async function getTemplate(inputs) {
  const getTemplateDataDelegate =
    inputs?.dependencies?.getTemplateData ??
    getTemplateData.bind({}, inputs.path);

  const { html, plainText, subject } = await getTemplateDataDelegate();

  return {
    html: html,
    text: plainText,
    subject: subject,
  };
}

async function getTemplateData(path) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `{ 
        current { 
          html, 
          plainText, 
          subject 
        } 
      }
    `,
    }),
  });
  const resObj = await res.json();

  const {
    data: { current },
  } = resObj;

  return current;
}

module.exports = {
  getTemplate: getTemplate,
};
