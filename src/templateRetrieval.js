const fetch = require("node-fetch");

const pathToTemplates =
  "https://raw.githubusercontent.com/Grunet/digestible-wcag-sc-emails/master/dist/";
const metadataFilename = "emailMetadata.json";

async function getTemplateAtRandom() {
  const metadataRes = await fetch(`${pathToTemplates}${metadataFilename}`);
  const metadataObj = await metadataRes.json();

  const listOfFilenames = metadataObj["emails"];
  const randomFilename =
    listOfFilenames[Math.floor(listOfFilenames.length * Math.random())][
      "filename"
    ];

  const emailRes = await fetch(`${pathToTemplates}${randomFilename}`);
  const emailHtml = await emailRes.text();

  return {
    html: emailHtml,
  };
}

module.exports = {
  getTemplateAtRandom: getTemplateAtRandom,
};
