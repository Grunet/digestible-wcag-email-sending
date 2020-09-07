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

  const {
    filenames: { html: htmlFilename, plainText: plainTextFilename },
    subject: chosenSubject,
  } = randomEmailMetadata;

  const [emailHtml, emailPlainText] = await Promise.all(
    [htmlFilename, plainTextFilename].map(async function (filename) {
      const res = await fetch(`${pathToTemplates}${filename}`);
      return await res.text();
    })
  );

  return {
    html: emailHtml,
    text: emailPlainText,
    subject: chosenSubject,
  };
}

module.exports = {
  getTemplateAtRandom: getTemplateAtRandom,
};
