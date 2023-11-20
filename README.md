# Yortal - inventory AWS Gateway APIs
Requires a config.json file in the root that looks like this:
```
{
  "swaggerHubToken": "your SwaggerHub api token",
  "swaggerHubOwner": "your SwaggerHub owner",
  "swaggerFetchSpecs": false,
  "accounts": [
    {
      "name": "aws-account-name",
      "disabled": false,
      "credentials":  {
          "accessKeyId": "account access key id",
          "secretAccessKey": "account secret access key",
          "sessionToken": "account session token"
      },
      "regions": [
        "eu-west-2",
        "us-east-1"
      ]
    },
    ...
  ]
}
```

Fetching specs from SwaggerHub is slow and you may get rate limited so it is off by default.

## Setup

```
npm install
```

## Run

```
npm start
```