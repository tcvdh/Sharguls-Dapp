import { ABI } from './abi.js';

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const infuraProvider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/a0ecf0217614452099724b8999730684");
const mainnetProvider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/a0ecf0217614452099724b8999730684");
const infuraContract = new ethers.Contract("0xF2Ea255E31842b8819d55d9D29D9ce0bAc0Ca02E", ABI, infuraProvider)
var contract;


// login
var walletAddress = "0x";
getTotalSupply();

async function loginWeb3() {

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "a0ecf0217614452099724b8999730684",
        rpc: {137: "https://polygon-mainnet.infura.io/v3/a0ecf0217614452099724b8999730684"},
      }
    },
    walletlink: {
      package: WalletLink,
      options: {
        appName: "SHARGULS", 
        rpc: "https://polygon-mainnet.infura.io/v3/a0ecf0217614452099724b8999730684",
        chainId: 137,
      }
    }
  };

  let web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });
  const instance = await web3Modal.connect();
  var provider = new ethers.providers.Web3Provider(instance);
  
  
  const currentChain = await provider.getNetwork()
  if(currentChain.chainId != 137) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }], // chainId must be in hexadecimal numbers
    });
    provider = new ethers.providers.Web3Provider(instance);
  }
  const signer = provider.getSigner();
  contract = new ethers.Contract("0xF2Ea255E31842b8819d55d9D29D9ce0bAc0Ca02E", ABI, signer)

  walletAddress = await signer.getAddress();
  const ethFirst = walletAddress.substring(0,4);
  const ethLast = walletAddress.substring(38,42);
  const fullAddress = `${ethFirst}...${ethLast}`;


  
  document.getElementById('connect').innerHTML = fullAddress;
  getENS()
  start()
}

async function getENS() {
  var fullAddress;

  const hasENS = await mainnetProvider.lookupAddress(walletAddress);

  if(hasENS) {
    fullAddress = hasENS
    document.getElementById('connect').innerHTML = fullAddress;
  }
  
}

async function getTotalSupply() {
    const totalSupply = await infuraContract.totalSupply()
    document.getElementById('totalSupply').innerHTML = `Minted: ${totalSupply}/3333`;
  }

  async function mint() {
    var amount = parseInt(document.getElementById('amountNumber').value);
    if(amount > 5) {
      document.getElementById('amounttext').innerHTML = `You can't mint more than 5 at a time`;
      $('#amounttext').addClass('text-danger');
      return
    }
    const singlePrice = await contract.price();
    const totalPrice = amount * singlePrice;

    var overrideOptions = {
      value: totalPrice.toString()
    }

    const receipt = await contract.mint(walletAddress, amount, overrideOptions);
    console.log(receipt);
    await start();
  }

  async function freeMint() {
    const receipt = await contract.whitelistMint(walletAddress);
    console.log(receipt);
    await start();
  }


async function main() {
    if (!contract) {
      await loginWeb3();
      return
    }
    
  
    if(document.getElementById('main').innerHTML === "MINT") {
      const whitelistedAmount = await contract.getWhitelist(walletAddress);
      if(whitelistedAmount == true) {
        if(Date.now() < 1652025600000) {
          await freeMint();
          await getTotalSupply();
        }  
      } else {
        document.getElementById('amounttext').innerHTML = `Please select the amount you want to mint:`;
        $('#amounttext').removeClass('text-danger');
        await mint();
      }
      await getTotalSupply();  
    }
  }



async function start() {
  getTotalSupply();

  const whitelistedAmount = await contract.getWhitelist(walletAddress);
  if(whitelistedAmount == true) {
    if(Date.now() < 1652025600000) {
      document.getElementById('cost').innerHTML = `You can mint 2 Sharguls for free!`;
      document.getElementById('amounttext').innerHTML = `click the button to start minting!`;
      $('#amounttext').removeClass('text-danger');
      document.getElementById("cost").style.visibility = "visible";
      document.getElementById("amounttext").style.visibility = "visible";
    }
  } else {
    document.getElementById('amounttext').innerHTML = `Please select the amount you want to mint:`;
    document.getElementById("amount").style.visibility = "visible";
    $('#amounttext').removeClass('text-danger');
    document.getElementById("cost").style.visibility = "visible";
    document.getElementById("amounttext").style.visibility = "visible";
  }

  document.getElementById('main').innerHTML = "MINT";
}

document.getElementById("main").onclick = main;
