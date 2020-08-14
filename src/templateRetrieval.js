const fetch = require("node-fetch");

const pathToTemplates =
  "https://raw.githubusercontent.com/Grunet/digestible-wcag-sc-emails/master/dist/";
const metadataFilename = "emailMetadata.json";

async function getTemplateAtRandom() {
  const metadataRes = await fetch(`${pathToTemplates}${metadataFilename}`);
  const metadataObj = await metadataRes.json();

  const listOfFilenames = metadataObj["emails"];
  const randomEmailMetadata =
    listOfFilenames[Math.floor(listOfFilenames.length * Math.random())];

  const { filename:chosenFilename, subject:chosenSubject } =
    randomEmailMetadata;

  const emailRes = await fetch(`${pathToTemplates}${chosenFilename}`);
  const emailHtml = await emailRes.text();

  return {
    html: emailHtml,
    subject: chosenSubject,
  };
}

module.exports = {
  getTemplateAtRandom: getTemplateAtRandom,
};
