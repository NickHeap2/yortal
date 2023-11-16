const { CloudFrontClient, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront')

async function getCloudFronts(credentials) {
  const client = new CloudFrontClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new ListDistributionsCommand(params)
  let cfList = []
  try {
    let data = {}
    do {
      console.log(`  Fetching cf data from ${data.NextToken || 'start'}...`.yellow)
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      if (data.DistributionList.Quantity > 0) {
        cfList = cfList.concat(data.DistributionList.Items)
      }
    } while (data.NextToken)
  } catch (error) {
    throw error
  }

  return cfList
}

module.exports = {
  getCloudFronts
}
