import { LambdaClient, ListFunctionsCommand, ListProvisionedConcurrencyConfigsCommand, paginateListProvisionedConcurrencyConfigs } from '@aws-sdk/client-lambda'

import { logObject, startProgressBar, startSpinner } from './util.js'

export async function getFunctions(credentials, accountName, region) {
  const client = new LambdaClient({ region, credentials })
  //  console.log(JSON.stringify(client, null, 2))
  const params = {
  }
  const command = new ListFunctionsCommand(params)
  let functionList = []

  const spinner = startSpinner()
  try {
    let data = {}
    do {
      spinner.text = `  Fetching functions from ${data.NextMarker || 'start'}...`.yellow

      command.input = { Marker: data.NextMarker }
      data = await client.send(command)
      // logObject(data)
      // process.exit(0)
      if (data.Functions) {
        const items = data.Functions.map((item) => {
          item.accountName = accountName
          return item
        })
        functionList = functionList.concat(items)
      }
    } while (data.NextMarker)
  } catch (error) {
    throw error
  } finally {
    spinner.stopAndPersist({ text: `  Fetched ${functionList.length} Functions`.yellow })
  }

  return functionList
}

export async function getProvisionedConcurrency(credentials, functions, region) {
  const client = new LambdaClient({ region, credentials });

  const params = {}
  const command = new ListProvisionedConcurrencyConfigsCommand(params)
  // paginateListProvisionedConcurrencyConfigs
  const bar = startProgressBar(functions, 'Fetching Provisioned Concurrency')
  for (const theFunction of functions) {
    command.input = {
      FunctionName: theFunction.FunctionArn,
      MaxItems: 50
    }

    let provisionedConcurrencyList = []
    try {
      // we need to slow down otherwise we get rate limited
      await new Promise(resolve => setTimeout(resolve, 10));
      // console.log(`  Fetching REST API stages data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      provisionedConcurrencyList = data.ProvisionedConcurrencyConfigs
    } catch (error) {
      throw error
    }

    theFunction.provisionedConcurrencyList = provisionedConcurrencyList

    bar.increment(1, { textValue: theFunction.FunctionArn })
  }
  bar.stop()
}
