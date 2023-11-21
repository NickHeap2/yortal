import { APIGatewayClient, GetRestApisCommand, GetStagesCommand, GetDeploymentsCommand, GetAuthorizersCommand } from '@aws-sdk/client-api-gateway'
// , GetRoutesCommand, GetIntegrationsCommand
import { logObject, startProgressBar, startSpinner } from './util.js'

export async function getRESTAPIs(credentials, accountName, region) {
  const client = new APIGatewayClient({ region, credentials });

  const params = {}
  const command = new GetRestApisCommand(params)
  let apiList = []

  const spinner = startSpinner()
  try {
    let data = {}
    do {
      spinner.text = `  Fetching REST APIs from ${data.NextToken || 'start'}...`.yellow

      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      // logObject(data)
      apiList = apiList.concat(data.items.map((api) => {
        api.accountName = accountName
        return api
      }))
    } while (data.NextToken)
  } catch (error) {
    throw error
  } finally {
    spinner.stopAndPersist({ text: `  Fetched ${apiList.length} REST APIs`.yellow })
  }

  return apiList
}

// export async function getRESTAPIRoutes(credentials, apis, region) {
//   const client = new APIGatewayClient({ region, credentials });

//   const params = {
//     MaxResults: "100"
//   }
//   const command = new GetRoutesCommand(params)

//   const bar = startProgressBar(apis, '      Fetching REST API routes')
//   for (let api of apis) {
//     command.input = {
//       restApiId: api.id,
//     }

//     let routesList = []
//     try {
//       const data = await client.send(command)
//       // logObject(data)
//       routesList = data.items
//     } catch (error) {
//       throw error
//     }

//     api.routesList = routesList

//     bar.increment(1, { textValue: api.ApiId })
//   }
//   bar.stop()
// }

// export async function getRESTAPIIntegrations(credentials, apis, region) {
//   const client = new APIGatewayClient({ region, credentials });

//   const params = {
//     MaxResults: "100"
//   }
//   const command = new GetIntegrationsCommand(params)

//   const bar = startProgressBar(apis, '      Fetching REST API integrations')
//   for (let api of apis) {
//     command.input = {
//       restApiId: api.id
//     }

//     let integrationsList = []
//     try {
//       const data = await client.send(command)
//       // logObject(data)
//       integrationsList = data.items
//     } catch (error) {
//       throw error
//     }

//     api.integrationsList = integrationsList

//     bar.increment(1, { textValue: api.ApiId })
//   }
//   bar.stop()
// }

export async function getRESTAPIStages(credentials, apis, region) {
  const client = new APIGatewayClient({ region, credentials });

  const params = {}
  const command = new GetStagesCommand(params)

  const bar = startProgressBar(apis, '      Fetching REST API stages')
  for (let api of apis) {
    command.input = {
      restApiId: api.id,
      limit: 100
    }

    let stagesList = []
    try {
      // console.log(`  Fetching REST API stages data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      stagesList = data.items
    } catch (error) {
      throw error
    }

    api.stages = stagesList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}

export async function getRESTAPIDeployments(credentials, apis, region) {
  const client = new APIGatewayClient({ region, credentials });

  const params = {}
  const command = new GetDeploymentsCommand(params)

  const bar = startProgressBar(apis, '      Fetching REST API deployments')
  for (let api of apis) {
    command.input = {
      restApiId: api.id
    }

    let deploymentsList = []
    try {
      // console.log(`  Fetching REST API deployments for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      deploymentsList = data.items
    } catch (error) {
      throw error
    }

    api.deployments = deploymentsList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}

export async function getRESTAPIAuthorisers(credentials, apis, region) {
  const client = new APIGatewayClient({ region, credentials });

  const params = {}
  const command = new GetAuthorizersCommand(params)

  const bar = startProgressBar(apis, '      Fetching REST API authorizers')
  for (let api of apis) {
    command.input = {
      restApiId: api.id
    }

    let authorizersList = []
    try {
      // console.log(`  Fetching REST API authorizers data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      authorizersList = data.items
    } catch (error) {
      throw error
    }

    api.authorizers = authorizersList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}
