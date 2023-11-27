import { APIGatewayClient, GetRestApisCommand, GetStagesCommand, GetDeploymentsCommand, GetAuthorizersCommand, GetResourcesCommand } from '@aws-sdk/client-api-gateway'
// , GetRoutesCommand, GetIntegrationsCommand
import { logObject, startProgressBar, startSpinner } from './util.js'

export async function getRESTAPIs(credentials, accountName, region) {
  const client = new APIGatewayClient({ region, credentials });

  const params = {
    limit: 25
  }
  const command = new GetRestApisCommand(params)
  let apiList = []

  const spinner = startSpinner()
  try {
    let data = {}
    do {
      spinner.text = `  Fetching REST APIs from ${data.position || 'start'}...`.yellow

      command.input.position = data.position
      data = await client.send(command)
      // logObject(data)
      apiList = apiList.concat(data.items.map((api) => {
        api.accountName = accountName
        return api
      }))
    } while (data.position)
  } catch (error) {
    throw error
  } finally {
    spinner.stopAndPersist({ text: `  Fetched ${apiList.length} REST APIs`.yellow })
  }

  return apiList
}


export async function getRESTAPIResources(credentials, apis, region) {
  const client = new APIGatewayClient({ region, credentials });

  const params = {
    limit: 25
  }
  const command = new GetResourcesCommand(params)

  const bar = startProgressBar(apis, '      Fetching REST API resources')
  for (let api of apis) {
    command.input = {
      restApiId: api.id,
      limit: 25,
      embed: [
        'methods'
      ]
    }

    let resourcesList = []
    try {
      let data = {}
      do {
        command.input.position = data.position
        data = await client.send(command)
        // logObject(data)
        resourcesList = resourcesList.concat(data.items)
      } while (data.position)
    } catch (error) {
      if (error.name === 'AccessDeniedException') {
        return []
      }
      throw error
    }

    api.resourcesList = resourcesList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}

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
      const data = await client.send(command)
      // logObject(data)
      stagesList = data.item
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
