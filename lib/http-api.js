const { ApiGatewayV2Client, GetApisCommand, GetStagesCommand, GetAuthorizersCommand, GetDeploymentsCommand } = require('@aws-sdk/client-apigatewayv2')

const { logObject, startProgressBar } = require('./util')

async function getHttpAPIs(credentials) {
  const client = new ApiGatewayV2Client({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetApisCommand(params)
  let apiList = []
  try {
    let data = {}
    do {
      console.log(`  Fetching Http APIs from ${data.NextToken || 'start'}...`.yellow)
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      apiList = apiList.concat(data.Items)
    } while (data.NextToken)
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      return []
    }
    throw error
  }

  return apiList
}

async function getHttpAPIStages(credentials, apis) {
  const client = new ApiGatewayV2Client({ region: "eu-west-2", credentials });

  const params = {
    MaxResults: "100"
  }
  const command = new GetStagesCommand(params)

  const bar = startProgressBar(apis, 'Fetching Http API stages')
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


async function getHttpAPIDeployments(credentials, apis) {
  const client = new ApiGatewayV2Client({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetDeploymentsCommand(params)

  const bar = startProgressBar(apis, 'Fetching Http API deployments')
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

async function getHttpAPIAuthorisers(credentials, apis) {
  const client = new ApiGatewayV2Client({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetAuthorizersCommand(params)

  const bar = startProgressBar(apis, 'Fetching Http API authorizers')
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

module.exports = {
  getHttpAPIs,
  getHttpAPIStages,
  getHttpAPIAuthorisers,
  getHttpAPIDeployments
}
