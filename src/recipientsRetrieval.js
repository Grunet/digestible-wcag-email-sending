require("node-fetch"); //amazon-cognito-identity-js uses the fetch API and needs a polyfill to be in place
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");

async function getRecipients(inputs) {
  const { subscribers } = await __retrieveSubscriberEmails(inputs);

  const recipients = Array.from(subscribers).map((accountObj) => {
    const { email: address, ...rest } = accountObj;
    const adaptedAccountObj = { emailAddress: address, ...rest };

    return adaptedAccountObj;
  });

  return {
    recipients: new Set(recipients),
  };
}

async function __retrieveSubscriberEmails(inputs) {
  const tryGetAuthToken =
    inputs?.dependencies?.tryGetAuthToken ?? __tryGetAuthToken;
  const getSubscribers =
    inputs?.dependencies?.getSubscribers ?? __getSubscribers;
  const { auth: authInfo, path } = inputs;

  const jwtAuthToken = await tryGetAuthToken(authInfo);

  const { subscribers: subscribersArray } = await getSubscribers(
    path,
    jwtAuthToken
  );

  return {
    subscribers: new Set(subscribersArray),
  };
}

async function __tryGetAuthToken(authInfo) {
  const { cognitoUser, authenticationDetails } = __hydrateCognitoObjects(
    authInfo
  );
  const jwtAccessToken = await __tryAuthenticatingAgainstCognito(
    cognitoUser,
    authenticationDetails
  );

  return jwtAccessToken;
}

function __hydrateCognitoObjects(authInfo) {
  const {
    credentials: { username, password },
    identifiers: { appClientId, userPoolId },
  } = authInfo;

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: username,
    Pool: new AmazonCognitoIdentity.CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: appClientId,
    }),
  });

  cognitoUser.setAuthenticationFlowType("USER_PASSWORD_AUTH");
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
    {
      Username: username,
      Password: password,
    }
  );

  return {
    cognitoUser: cognitoUser,
    authenticationDetails: authenticationDetails,
  };
}

async function __tryAuthenticatingAgainstCognito(
  cognitoUser,
  authenticationDetails
) {
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        const accessToken = result.getAccessToken().getJwtToken();

        resolve(accessToken);
      },
      onFailure: function (err) {
        console.error(err);

        reject(
          "Failed to authenticate against the API's AWS Cognito User Pool"
        );
      },
    });
  });
}

async function __getSubscribers(path, jwtAccessToken) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtAccessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      //Apollo-Server specifics
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    },
    body: JSON.stringify({
      query: `{ 
        subscribers { 
          email
        } 
      }
    `,
    }),
  });
  const { data } = await res.json();

  return data;
}

module.exports = {
  getRecipients: getRecipients,
};
