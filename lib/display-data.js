const { stringify } = require('ajv')
const { logObject } = require('./util')

const GET_SPECS = true

async function displayData(httpAPIs, restAPIs, cfs, swaggerHubOptions) {
  for (let cf of cfs) {
    console.log('-'.repeat(20).red)
    console.log(`Domain: [${cf.DomainName}] Description: [${cf.Comment}]`.green)
    if (cf.Aliases.Quantity > 0) {
      for (let alias of cf.Aliases.Items) {
        console.log(`  Alias=[${alias}]`.green)
      }
    }

    if (cf.DefaultCacheBehavior) {
      await displayCacheBehaviour(cf.DefaultCacheBehavior, httpAPIs, restAPIs, cf, swaggerHubOptions)
    }

    if (cf.CacheBehaviors.Quantity > 0) {
      for (let cacheBehaviour of cf.CacheBehaviors.Items) {
        await displayCacheBehaviour(cacheBehaviour, httpAPIs, restAPIs, cf, swaggerHubOptions)
      }
    }
  }
}

// function displayAPIs(apis) {
//   for (let api of apis) {
//     console.log('-'.repeat(20))
//     console.log(`${api.Name}`)
//     console.log(`${JSON.stringify(api.Tags, null, 2)}`)
//   }
// }

async function displayCacheBehaviour(cacheBehaviour, httpAPIs, restAPIs, cf, swaggerHubOptions) {
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
    }
  }

  const origin = cf.Origins.Items.find((origin) => origin.Id === cacheBehaviour.TargetOriginId)
  if (origin) {
    console.log(`    Target Origin Id=[${origin.Id}] DomainName=[${origin.DomainName}]`.blue)

    const httpsDomain = `https://${origin.DomainName}`
    let matchingAPI = httpAPIs.find((api) => api.ApiEndpoint === httpsDomain)
    let matchingAPIName = undefined
    if (matchingAPI) {
      matchingAPIName = matchingAPI.Name
      console.log(`      HTTP APIGateway=[${matchingAPI.Name}] Account=[${matchingAPI.accountName}]`.grey)
      // logObject(matchingAPI)
      for (const stage of matchingAPI.stages) {
        console.log(`        Stage name=[${stage.StageName}]`.white)
      }

      for (const authorizer of matchingAPI.authorizers) {
        console.log(`        Authorizer Type=[${authorizer.AuthorizerType}] Name=[${authorizer.Name}] authorizerResultTtlInSeconds=[${dontLikeZero(authorizer.AuthorizerResultTtlInSeconds)}]`)
      }
    } else {
      matchingAPI = restAPIs.find((api) => {
        const apiUrl = `https://${api.id}.execute-api.eu-west-2.amazonaws.com`
        return (apiUrl === httpsDomain)
      })
      if (matchingAPI) {
        matchingAPIName = matchingAPI.name
        console.log(`      REST APIGateway=[${matchingAPI.name}] Account=[${matchingAPI.accountName}]`.white)
        for (const stage of matchingAPI.stages) {
          console.log(`        Stage name=[${stage.stageName}]`.white)
        }

        for (const authorizer of matchingAPI.authorizers) {
          console.log(`        Authorizer Type=[${authorizer.type}] Name=[${authorizer.name}] authorizerResultTtlInSeconds=[${dontLikeZero(authorizer.authorizerResultTtlInSeconds)}]`.white)
        }
      }
    }
  } 

  if (swaggerHubOptions.fetchSpecs && matchingAPIName) {
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
}

function displayCloudFronts(cfs) {
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


function dontLikeZero(value) {
  if (value === 0) {
    return `${value}`.red
  } else {
    return `${value}`.green
  }
}

module.exports = {
  displayData,
  displayCloudFronts
}