/* eslint no-undef: 0 */
/* eslint no-loop-func: 0 */
/* eslint no-alert: 0 */

// current account properties
let currentAccount

// global token instance
let pokemonTokenInstance

window.App = {
  // transfer the token to another recipeint
  transferToken: async (tokenId) => {
    const currentPokemonCard = document.getElementById(`pokemon-${tokenId}`)
    const receiver = document.getElementById(`input-${tokenId}`).value
    if (receiver === '') {
      alert('Empty recipient')
      return
    }
    const gas = await pokemonTokenInstance.methods.safeTransferFrom(
      currentAccount,
      receiver,
      tokenId
    ).estimateGas({ from: currentAccount })
    
    console.log('gas')
    console.log(gas)

    web3.eth.getGasPrice((estimateGasError, gasPrice) => {
      if (estimateGasError) {
        alert('Something wrong getting gasPrice')
        return
      }
      pokemonTokenInstance.methods.safeTransferFrom(
        currentAccount,
        receiver,
        tokenId,
      ).send({
          from: currentAccount,
          gas: gas + 1000000,
          gasPrice,
        },
        (safeTransferFromError) => {
          if (safeTransferFromError) {
            alert('Something went wrong transfering the pokemon')
            return
          }
          // remove the transfered element
          currentPokemonCard.remove()
        },
      )
    })
  },
  // get the amount of token owned by the current account
  getUserTokenBalance: async () => {
    // console.log(pokemonTokenInstance)
    const result = await pokemonTokenInstance.methods.balanceOf(currentAccount)
    if (result.toString(10) === '0') {
      alert('Your account does not have any Pokemon token or something went wrong contacting the smart contract')
      return
    }
    console.log(result)
    const tokenOwnedAmountOwnedByAccount = result.arguments
    console.log(' result.arguments')
    console.log( result.arguments)
    App.getTokenOwnedIdsByAccount(tokenOwnedAmountOwnedByAccount)
  },
  // fill an array with each token id owned by the current owner
  getTokenOwnedIdsByAccount: async (tokenOwnedAmountOwnedByAccount) => {
    // console.log(tokenOwnedAmountOwnedByAccount)
    // console.log(pokemonTokenInstance)
    // console.log(pokemonTokenInstance.methods)
    console.log(currentAccount == tokenOwnedAmountOwnedByAccount)
    if(currentAccount != tokenOwnedAmountOwnedByAccount) {
      return
    }
    try {
      const task = []
      for(let x = 0; x < 151; x++){
        task.push(pokemonTokenInstance.methods.tokenOfOwnerByIndex(tokenOwnedAmountOwnedByAccount[0], x).call())
      }
      Promise.allSettled(task).then((result) => {
        result && result.forEach((item) => {
          const tokenId = item.value ? item.value.toString(10) : null
          tokenId && App.getTokenURI(tokenId)
        })
      }).catch((err)=>{
        console.error('err', err)
        //
      })

    } catch(err) {
      console.error(err)
      // alert('Something went wrong getting tokens id of your account or something went wrong contacting the smart contract')
    }
  },
  // get token URI
  getTokenURI: (tokenId) => {
    pokemonTokenInstance.methods.tokenURI(tokenId).call((err, tokenURI) => {
      if (err) {
        alert('Something went wrong getting token URI or something went wrong contacting the smart contract')
      } else {
        App.getTokenURIData(tokenId, tokenURI)
      }
    })
  },
  // get token URI data
  getTokenURIData: (tokenId, url) => {
    const http = new XMLHttpRequest()
    http.open('GET', url)
    http.send()
    http.onload = () => {
      let tokenURIData
      try {
        tokenURIData = JSON.parse(http.responseText)
      } catch (e) {
        alert('Something went wrong getting token URI data')
      }
      if (!tokenURIData.error) App.getAdditionalMetaDataFromURI(tokenId, tokenURIData)
      else alert('Something went wrong getting token URI data')
    }
  },
  // get addition meta data from tokenURIData
  getAdditionalMetaDataFromURI: (tokenId, tokenURIData) => {
    const http = new XMLHttpRequest()
    http.open('GET', tokenURIData.meta)
    http.send()
    http.onload = () => {
      let additionalData
      try {
        additionalData = JSON.parse(http.responseText)
      } catch (e) {
        // since the additional meta data is not required do not alert any error
        additionalData = ''
      }
      if (!additionalData.error) App.drawCard(tokenId, tokenURIData, additionalData)
      else alert('Something went wrong getting token URI additional data')
    }
  },
  // draw a card into the index.html based on the token ids owned by the current owner
  drawCard: (tokenId, tokenURIItem, additionalData) => {
    let card
    if (additionalData) {
      card = `
        <div class="col-md-3 card" id="pokemon-${tokenId}">
          <img class="card-img-top" style="height: 253px;" src="${tokenURIItem.image}" alt="Card image cap">
          <div class="card-body" style="border-top: 1px solid rgba(0,0,0,.125);">
            <h5 class="card-title">${tokenURIItem.name}</h5>
            <p class="card-text">
              ${tokenURIItem.description}
            </p>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">Type: ${additionalData.type}</li>
          </ul>
          <div class="card-body">
            <div class="input-group mb-3">
              <input id="input-${tokenId}" type="text" class="form-control" placeholder="Recipient" aria-label="Recipient" aria-describedby="basic-addon2">
              <div class="input-group-append">
                <button id="button-${tokenId}"  onclick="App.transferToken(${tokenId})" class="btn btn-outline-secondary" type="button">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      `
    } else {
      card = `
        <div class="col-md-3 card" id="pokemon-${tokenId}">
          <img class="card-img-top" style="height: 253px;" src="${tokenURIItem.image}" alt="Card image cap">
          <div class="card-body" style="border-top: 1px solid rgba(0,0,0,.125);">
            <h5 class="card-title">${tokenURIItem.name}</h5>
            <p class="card-text">
              ${tokenURIItem.description}
            </p>
            <div class="input-group mb-3">
              <input id="input-${tokenId}" type="text" class="form-control" placeholder="Recipient" aria-label="Recipient" aria-describedby="basic-addon2">
              <div class="input-group-append">
              <button id="button-${tokenId}"  onclick="App.transferToken(${tokenId})" class="btn btn-outline-secondary" type="button">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      `
    }
    // TODO:
    // fix the append method is not working as desired
    const listDiv = document.getElementById('row')
    listDiv.insertAdjacentHTML('beforeend', card)
  },
  startWatchTransfer: (account) => {
    pokemonTokenInstance.events.Transfer({ from: account, fromBlock : 'latest' }, (error, transferEvent)=>{
      if (error) alert('Error in getting the Transfer events')
      console.log('Transfer: ', transferEvent)
    })
  },
  // bootstrap the app getting the current metamask account
  start: () => {
    // TODO:
    // find a way to catch metamask switch account
    web3.eth.getAccounts((err, accs) => {
      console.log('GET ACCOUNTS', accs)
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }
      if (accs.length === 0) {
        alert('Could not get any accounts! Make sure your Ethereum client is configured correctly and Metamask account is unlocked.')
        return
      }
      [currentAccount] = accs
      // window.ethereum.enable()
      App.startWatchTransfer(currentAccount)
      App.getUserTokenBalance()
    })
  },
}

window.addEventListener('load', () => {
  if (typeof window.ethereum !== 'undefined') {
    window.web3 = new Web3(ethereum)
    ethereum.enable()
    const http = new XMLHttpRequest()
    http.open('GET', '/api/config')
    http.send()
    http.onload = () => {
      const result = JSON.parse(http.responseText)
      const pokemonTokenAbi = result.tokenArtifact.abi
      const { networkId } = result
      const pokemonTokenAddress = result.tokenArtifact.networks[networkId].address
      // const pokemonTokenAddress = '0xfED48B53F604de04403E9b64aDf1387e0aA8aE4A' // result.tokenArtifact.networks[networkId].address
      pokemonTokenInstance = new web3.eth.Contract(pokemonTokenAbi, pokemonTokenAddress)
      App.start()
    }
  } else {
    // no metamask
    alert('No Metamask.')
  }
})
