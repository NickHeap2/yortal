import { ParameterConstraints } from '@aws-sdk/client-apigatewayv2'
import { logObject } from './util.js'

const GET_SPECS = true

export async function displayData(httpAPIs, restAPIs, cfs, functions, swaggerHubOptions) {
  // displayFunctions(functions)
  // process.exit(1)

  for (let cf of cfs) {
    console.log('-'.repeat(20).red)
    console.log(`Domain: [${cf.DomainName}] Account=[${cf.accountName}] Description: [${cf.Comment}]`.green)
    if (cf.Aliases.Quantity > 0) {
      for (let alias of cf.Aliases.Items) {
        console.log(`  Alias=[${alias}]`.green)
      }
    }

    if (cf.DefaultCacheBehavior) {
      await displayCacheBehaviour(cf.DefaultCacheBehavior, httpAPIs, restAPIs, cf, functions, swaggerHubOptions)
    }

    if (cf.CacheBehaviors.Quantity > 0) {
      for (let cacheBehaviour of cf.CacheBehaviors.Items) {
        await displayCacheBehaviour(cacheBehaviour, httpAPIs, restAPIs, cf, functions, swaggerHubOptions)
      }
    }
  }
}

async function displayCacheBehaviour(cacheBehaviour, httpAPIs, restAPIs, cf, functions, swaggerHubOptions) {
  const pathPattern = cacheBehaviour.PathPattern || '*'
  if (cacheBehaviour.PathPattern && cacheBehaviour.MinTTL !== undefined) {
    console.log(`  Caching Behaviour PathPattern=[${pathPattern}] MinTTL=[${dontLikeZero(cacheBehaviour.MinTTL)}], DefaultTTL=[${dontLikeZero(cacheBehaviour.DefaultTTL)}], MaxTTL=[${dontLikeZero(cacheBehaviour.MaxTTL)}]`)

    let headers = ''
    if (cacheBehaviour.ForwardedValues && cacheBehaviour.ForwardedValues.Headers.Quantity > 0) {
      headers = cacheBehaviour.ForwardedValues.Headers.Items.join(', ')
    }
    const forwardQueryString = cacheBehaviour.ForwardedValues.QueryString
    const forwardCookies = cacheBehaviour.ForwardedValues.Cookies.Forward

    console.log(`    Forward Values QueryString=[${forwardQueryString}] Cookies=[${forwardCookies}] Headers=[${headers}]`.cyan)  
  } else {
    console.log(`  Caching Behaviour PathPattern=[${pathPattern}] ` + `Caching is disabled!`.red) 
  }

  if (cacheBehaviour.LambdaFunctionAssociations.Quantity > 0) {
    console.log('    Associated Lambda Functions:'.cyan)
    for (const lambdaFunction of cacheBehaviour.LambdaFunctionAssociations.Items.sort((a, b) => a.EventType.localeCompare(b.EventType))) {
      const functionParts = lambdaFunction.LambdaFunctionARN.split(':')
      console.log(`      ${lambdaFunction.EventType} Region=[${functionParts[3]}] Account=[${functionParts[4]}] Function=[${functionParts[6]}] Version=[${functionParts[7]}]`.cyan)

      const theFunction = getFunction(functions, lambdaFunction.LambdaFunctionARN)
      if (theFunction) {
        displayFunction(theFunction, '        ')
      } else {
        console.log(`        Failed to find function! [${lambdaFunction.LambdaFunctionARN}]`.yellow)
      }
    }
  }

  const origin = cf.Origins.Items.find((origin) => origin.Id === cacheBehaviour.TargetOriginId)
  if (origin) {
    console.log(`    Target Origin Id=[${origin.Id}] DomainName=[${origin.DomainName}]`.blue)

    const httpsDomain = `https://${origin.DomainName}`
    let matchingAPI = httpAPIs.find((api) => api.ApiEndpoint === httpsDomain)
    let matchingAPIName
    if (matchingAPI) {
      matchingAPIName = matchingAPI.Name
      console.log(`      HTTP APIGateway=[${matchingAPI.Name}] Account=[${matchingAPI.accountName}]`.grey)

      // logObject(matchingAPI)
      if (matchingAPI.stages) {
        for (const stage of matchingAPI.stages) {
          console.log(`        Stage name=[${stage.StageName}]`.white)
        }
      }

      if (matchingAPI.authorizers) {
        for (const authorizer of matchingAPI.authorizers) {
          displayAuthorizer(functions, authorizer.AuthorizerUri, authorizer.AuthorizerType, authorizer.Name, authorizer.AuthorizerResultTtlInSeconds)
        }
      }

      if (matchingAPI.routesList) {
        console.log('        Routes'.cyan)
        for (const route of matchingAPI.routesList) {
          // logObject(route)
          if (route.OperationName === undefined) {
            console.log('          Operation=['.cyan + 'NO OPERATION IN OPENAPI'.red + `] Key=[${route.RouteKey}]`.cyan)
          } else {
            console.log(`          Operation=[${route.OperationName || ''}] Key=[${route.RouteKey}]`.cyan)
          }

          if (route.Target) {
            displayTarget(matchingAPI.integrationsList, route.Target.split('/')[1], functions)
          } else {
            console.log(`            Operation has no target integration!`.red)
          }
        }
      }

      // if (matchingAPI.integrationsList) {
      //   console.log('        Integrations'.cyan)
      //   for (const integration of matchingAPI.integrationsList) {

      //     const parts = integration.IntegrationUri.split(':')
      //     const integrationARN = `arn:${parts[6]}:${parts[7]}:${parts[8]}:${parts[9]}:${parts[10]}:${parts[11].split('/')[0]}`
      //     console.log(`          Integration=[${integration.IntegrationId}] Timeout=[${integration.TimeoutInMillis}] FunctionArn=[${integrationARN}]`.cyan)

      //     // arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:851541485673:function:module-salesforce-connector-api-opportunitiesList-NOPRvhpluqad/invocations
      //     const theFunction = getFunction(functions, integrationARN)
      //     if (theFunction) {
      //       displayFunction(theFunction, '        ')
      //     } else {
      //       console.log(`          Failed to find function [${integrationARN}]!`.yellow)
      //     }
      //   }
      // }
      // route
      // {
      //   "ApiKeyRequired": false,
      //   "AuthorizationScopes": [],
      //   "AuthorizationType": "NONE",
      //   "OperationName": "appletCategoriesDelete",
      //   "RequestParameters": {},
      //   "RouteId": "o0chud1",
      //   "RouteKey": "DELETE /applet-categories/{appletCategoryId}"
      // },
      // integration
      // {
      //   "ConnectionType": "INTERNET",
      //   "IntegrationId": "wxw9gwi",
      //   "IntegrationMethod": "POST",
      //   "IntegrationType": "AWS_PROXY",
      //   "IntegrationUri": "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:607916373790:function:platform-data-feed-replacement-standAloneTasksPost-0SMghyKt,
      //   "PayloadFormatVersion": "2.0",
      //   "TimeoutInMillis": 30000
      // }

    } else {
      matchingAPI = restAPIs.find((api) => {
        const apiUrl = `https://${api.id}.execute-api.eu-west-2.amazonaws.com`
        return (apiUrl === httpsDomain)
      })
      if (matchingAPI) {
        matchingAPIName = matchingAPI.name
        console.log(`      REST APIGateway=[${matchingAPI.name}] Account=[${matchingAPI.accountName}]`.magenta)

        if (matchingAPI.stages) {
          for (const stage of matchingAPI.stages) {
            console.log(`        Stage name=[${stage.stageName}]`.white)
          }
        }

        if (matchingAPI.authorizers) {
          for (const authorizer of matchingAPI.authorizers) {
            displayAuthorizer(functions, authorizer.authorizerUri, authorizer.type, authorizer.name, authorizer.authorizerResultTtlInSeconds)
          }
        }

        // if (matchingAPI.routesList) {
        //   for (const route of matchingAPI.routesList) {
        //     console.log(`        Operation=[${route.operationName}] Key=[${route.routeKey}]`)
        //   }
        // }

        // if (matchingAPI.integrationsList) {
        //   for (const integration of matchingAPI.integrationsList) {
        //     console.log(`        Integration=[${integration.integrationId}] Timeout=[${integration.timeoutInMillis}] Uri=[${integration.integrationUri}]`)
        //   }
        // }
      }
    }

    if (swaggerHubOptions.fetchSpecs && matchingAPIName) {
      await processSwaggerHub(swaggerHubOptions, matchingAPIName)
    }
  } 
}

function displayTarget(integrations, target, functions) {
  const integration = integrations.find((i) => i.IntegrationId === target)
  if (integration) {
    const parts = integration.IntegrationUri.split(':')
    const integrationARN = `arn:${parts[6]}:${parts[7]}:${parts[8]}:${parts[9]}:${parts[10]}:${parts[11].split('/')[0]}`
    console.log(`            Integration=[${integration.IntegrationId}] Timeout=[${integration.TimeoutInMillis}] FunctionArn=[${integrationARN}]`.cyan)

    // arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-west-2:851541485673:function:module-salesforce-connector-api-opportunitiesList-NOPRvhpluqad/invocations
    const theFunction = getFunction(functions, integrationARN)
    if (theFunction) {
      displayFunction(theFunction, '              ')
    } else {
      console.log(`              Failed to find function [${integrationARN}]!`.yellow)
    }
  } else {
    console.log(`            Failed to find Integration target [${target}]!`.red)
  }
}

function displayAuthorizer(functions, authorizerUri, type, name, authorizerResultTtlInSeconds) {
  // console.log(`AuthorizerUri: ${authorizer.authorizerUri}`.red)
  const parts = authorizerUri.split(':')
  const authorizerARN = `arn:${parts[6]}:${parts[7]}:${parts[8]}:${parts[9]}:${parts[10]}:${parts[11].split('/')[0]}`
  const region = parts[8]
  const account = parts[9]
  const authFunction = parts[11].split('/')[0]

  console.log(`        Authorizer Type=[${type}] Name=[${name}] authorizerResultTtlInSeconds=[${dontLikeZero(authorizerResultTtlInSeconds)}] Region=[${region}] Account=[${account}] Function=[${authFunction}]`.white)

  const theFunction = getFunction(functions, authorizerARN)
  if (theFunction) {
    displayFunction(theFunction, '          ')
  } else {
    console.log(`          Failed to find function [${authorizerARN}]!`.yellow)
  }
}

function displayFunction(theFunction, padding) {
      console.log(`${padding}Timeout=[${theFunction.Timeout}] Memory Size=[${theFunction.MemorySize}] Code Size=[${theFunction.CodeSize}]`.yellow)
  if (theFunction.provisionedConcurrencyList) {
    for (const concurrency of theFunction.provisionedConcurrencyList) {
      console.log(`${padding}  ProvisionedConcurrency: Status=[${concurrency.Status}], Requested=[${concurrency.RequestedProvisionedConcurrentExecutions}], Available=[${concurrency.AvailableProvisionedConcurrentExecutions}], Allocated=[${concurrency.AllocatedProvisionedConcurrentExecutions}]`.yellow)
    }
  }
}

function getFunction(functions, lambdaFunctionARN) {
  const parts = lambdaFunctionARN.split(':')

  let lambdaVersion = ''
  // do we have a version?
  if (parts.length > 7) {
    lambdaVersion = parts.pop()
  }
  const lambdaFunction = parts.join(':')

  // console.log(`(Finding FunctionArn=${lambdaFunction} Version=[${lambdaVersion}]...)`)
  return functions.find((f) => f.FunctionArn === lambdaFunction)
}

export function displayCloudFronts(cfs) {
  for (let cf of cfs) {
    console.log('-'.repeat(20))
    console.log(`${cf.DomainName}`)
    if (cf.Aliases.Quantity > 0) {
      for (let alias of cf.Aliases.Items) {
        console.log(`  Alias=${alias}`)
      }
    } else {
      console.log(`  Description=${cf.Description}`)
    }
    // console.log(`${JSON.stringify(cf, null, 2)}`)
    // console.log(`${JSON.stringify(cf, null, 0)}`)

    // if (cf.Origins.Quantity > 0) {
    for (let origin of cf.Origins.Items) {
      console.log(`Origin Id=[${origin.Id}] DomainName=[${origin.DomainName}]`)

      const cacheBehaviour = cf.CacheBehaviors.Items.find((behaviour) => behaviour.TargetOriginId === origin.Id)
      if (cacheBehaviour) {
        console.log(`    Caching Behaviour PathPattern=[${cacheBehaviour.PathPattern}] MinTTL=[${dontLikeZero(cacheBehaviour.MinTTL)}], DefaultTTL=[${dontLikeZero(cacheBehaviour.DefaultTTL)}], MaxTTL=${dontLikeZero(cacheBehaviour.MaxTTL)}`)
      } else {
        console.log(``)
      }
    }
  }
}

export function displayFunctions(functions) {
  for (const theFunction of functions) {
    console.log(`FunctionArn[${theFunction.FunctionArn}] Timeout=[${theFunction.Timeout}] Memory Size=[${theFunction.MemorySize}] Code Size=[${theFunction.CodeSize}]`.yellow)
  }
}

export function displayAPIs(apis) {
  for (let api of apis) {
    console.log('-'.repeat(20))
    console.log(`${api.Name}`)
    console.log(`${JSON.stringify(api.Tags, null, 2)}`)
  }
}


function dontLikeZero(value) {
  if (value === 0) {
    return `${value}`.red
  } else {
    return `${value}`.green
  }
}

async function processSwaggerHub(swaggerHubOptions, matchingAPIName) {
  const searchName = matchingAPIName
  .replace(/-/g, ' ')
  .replace(/_/g, ' ')
  .split(' ')
  .map((word) => {
    if (word.length <= 3) {
      return ''
    } else {
      return word
    }
  })
  .filter((word) => word != '')
  .join(' ')
  // console.log(`    Looking for ${searchName}...`.yellow)
  const searchOptions = {
    specType: 'API',
    owner: swaggerHubOptions.owner,
    query: searchName,
    sort: 'BEST_MATCH',
    order: 'DESC'
  }
  // try and link to swaggerhub
  const results = await swaggerHubOptions.swaggerHub.searchApisAndDomains(searchOptions, {})
  // console.log(JSON.stringify(results, null, 2))
  // console.log(results.totalCount)
  if (results.apis.length === 1) {
    const spec = results.apis[0]
    console.log(`        SwaggerHub Spec=[${spec.name}] Url=[${spec.properties[0].url}]`.cyan)
    console.log(`            Description=[${spec.description.split('\n')[0]}]`.cyan)
  } else if (results.apis.length > 0 && results.apis.length <= 5) {
    const spec = results.apis[0]
    console.log(`        Possible SwaggerHub Spec=[${spec.name}] Url=[${spec.properties[0].url}]`.yellow)
    console.log(`            Description=[${spec.description.split('\n')[0]}]`.yellow)
  } else {
    console.log(`        Couldn't resolve SwaggerHub using search '${searchName}'!`.yellow)
  }
}