# Yortal - inventory AWS Gateway APIs
Requires a config.json file in the root that looks like this:
```
{
  "swaggerHubToken": "your SwaggerHub api token",
  "swaggerHubOwner": "your SwaggerHub owner",
  "accounts": [
    {
      "name": "aws-account-name",
      "credentials":  {
          "accessKeyId": "account access key id",
          "secretAccessKey": "account secret access key",
          "sessionToken": "account session token"
      }
    },
    ...
  ]
}
```