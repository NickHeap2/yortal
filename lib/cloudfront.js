import { CloudFrontClient, ListDistributionsCommand } from '@aws-sdk/client-cloudfront'

import { logObject, startSpinner } from './util.js'

export async function getCloudFronts(credentials, accountName, region) {
  const client = new CloudFrontClient({ region, credentials });

  const params = {}
  const command = new ListDistributionsCommand(params)
  let cfList = []

  const spinner = startSpinner()
  try {
    let data = {}
    do {
      spinner.text = `  Fetching cf data from ${data.NextToken || 'start'}...`.yellow
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      if (data.DistributionList.Quantity > 0) {
        const items = data.DistributionList.Items.map((item) => {
          item.accountName = accountName
          return item
        })
        cfList = cfList.concat(items)
      }
    } while (data.NextToken)
  } catch (error) {
    throw error
  } finally {
    spinner.stopAndPersist({ text: `  Fetched ${cfList.length} CloudFronts`.yellow })
  }

  return cfList
}
