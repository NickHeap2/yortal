import { ApiGatewayV2Client, GetApisCommand, GetStagesCommand, GetAuthorizersCommand, GetDeploymentsCommand, GetRoutesCommand, GetIntegrationsCommand } from '@aws-sdk/client-apigatewayv2'

import { logObject, startProgressBar, startSpinner } from './util.js'

export async function getHttpAPIs(credentials, accountName, region) {
  const client = new ApiGatewayV2Client({ region, credentials });

  const params = {}
  const command = new GetApisCommand(params)
  let apiList = []

  const spinner = startSpinner()
  try {
    let data = {}
    do {
      spinner.text = `  Fetching Http APIs from ${data.NextToken || 'start'}...`.yellow

      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      apiList = apiList.concat(data.Items.map((api) => {
        api.accountName = accountName
        return api
      }))
    } while (data.NextToken)
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      return []
    }
    throw error
  } finally {
    spinner.stopAndPersist({ text: `  Fetched ${apiList.length} Http APIs`.yellow })
  }

  return apiList
}

export async function getHttpAPIRoutes(credentials, apis, region) {
  const client = new ApiGatewayV2Client({ region, credentials });

  const params = {
    MaxResults: "100"
  }
  const command = new GetRoutesCommand(params)

  const bar = startProgressBar(apis, '      Fetching Http API routes')
  for (let api of apis) {
    command.input = {
      ApiId: api.ApiId
    }

    let routesList = []
    try {
      let data = {}
      do {
        command.input.NextToken = data.NextToken
        data = await client.send(command)
        routesList = routesList.concat(data.Items)
      } while (data.NextToken)
    } catch (error) {
      if (error.name === 'AccessDeniedException') {
        return []
      }
      throw error
    }

    api.routesList = routesList

    bar.increment(1, { textValue: api.ApiId })
  }
  bar.stop()
}

export async function getHttpAPIIntegrations(credentials, apis, region) {
  const client = new ApiGatewayV2Client({ region, credentials });

  const params = {
    MaxResults: "100"
  }
  const command = new GetIntegrationsCommand(params)

  const bar = startProgressBar(apis, '      Fetching Http API integrations')
  for (let api of apis) {
    command.input = {
      ApiId: api.ApiId
    }

    let integrationsList = []
    try {
      let data = {}
      do {
        command.input.NextToken = data.NextToken
        data = await client.send(command)
        integrationsList = integrationsList.concat(data.Items)
      } while (data.NextToken)
    } catch (error) {
      if (error.name === 'AccessDeniedException') {
        return []
      }
      throw error
    }

    api.integrationsList = integrationsList

    bar.increment(1, { textValue: api.ApiId })
  }
  bar.stop()
}

export async function getHttpAPIStages(credentials, apis, region) {
  const client = new ApiGatewayV2Client({ region, credentials });

  const params = {
    MaxResults: "100"
  }
  const command = new GetStagesCommand(params)

  const bar = startProgressBar(apis, '      Fetching Http API stages')
  for (let api of apis) {
    command.input = {
      ApiId: api.ApiId
    }

    let stagesList = []
    try {
      // console.log(`  Fetching Http API stages data for ${api.ApiId || ''}...`.yellow)
      const data = await client.send(command)
      //logObject(data)
      stagesList = data.Items
    } catch (error) {
      throw error
    }

    api.stages = stagesList

    bar.increment(1, { textValue: api.ApiId })
  }
  bar.stop()
}

export async function getHttpAPIDeployments(credentials, apis, region) {
  const client = new ApiGatewayV2Client({ region, credentials });

  const params = {}
  const command = new GetDeploymentsCommand(params)

  const bar = startProgressBar(apis, '      Fetching Http API deployments')
  for (let api of apis) {
    command.input = {
      ApiId: api.ApiId
    }

    let deploymentsList = []
    try {
      // console.log(`  Fetching Http API deployments data for ${api.ApiId || ''}...`.yellow)
      const data = await client.send(command)
      deploymentsList = data.Items
    } catch (error) {
      throw error
    }

    api.deployments = deploymentsList

    bar.increment(1, { textValue: api.ApiId })
  }
  bar.stop()
}

export async function getHttpAPIAuthorisers(credentials, apis, region) {
  const client = new ApiGatewayV2Client({ region, credentials });

  const params = {}
  const command = new GetAuthorizersCommand(params)

  const bar = startProgressBar(apis, '      Fetching Http API authorizers')
  for (let api of apis) {
    command.input = {
      ApiId: api.ApiId
    }

    let authorizersList = []
    try {
      // console.log(`  Fetching Http API authorizers data for ${api.ApiId || ''}...`.yellow)
      const data = await client.send(command)
      //logObject(data)
      authorizersList = data.Items
    } catch (error) {
      throw error
    }

    api.authorizers = authorizersList

    bar.increment(1, { textValue: api.ApiId })
  }
  bar.stop()
}
