import React, { Component } from 'react';
import './FileUpload';


import { ethers } from "ethers"
import { Card, Button } from 'react-bootstrap'
import './home.css';
import './fileUpload.css';
import './modal';
import Modal from './modal';

import marketAbi from './marketAbi.json'; 
import nftAbi from './nftAbi.json';
import './styles/components/_button.scss';
import logo from './nft.jpg'
import ether from './etherss.svg'


class ContractInteraction extends Component {
  constructor(props) {
    super(props);
    this.state = {
 
      timer: 20,
 contract: null,
 contractAddress : process.env.REACT_APP_NFT_ADD,
 contractABI : nftAbi,
market_contract: null,
market_contractAddress : process.env.REACT_APP_MARKET_ADD,
market_contractABI : marketAbi,
tokenCount: 0, 
loading: true,
setLoading: true,
items: [],
setItems: [],
showMintAndListForm: false,
isDropdownOpen: false,


//form
file: null,
name: '',
description: '',
external_url: '',
price:'',
provider: null,
signer: null,
signerAddress: null,


isWalletConnected: false,
cid : '',

JWT: process.env.REACT_APP_JWT,
toggleMintAndListForm : () => {
  this.setState((prevState) => ({
    showMintAndListForm: !prevState.showMintAndListForm,
  }))},
 

  }
this.toggleDropdown = this.toggleDropdown.bind(this);
  this.openModal = this.openModal.bind(this);}
  toggleDropdown = () => {
    this.setState((prevState) => ({
      isDropdownOpen: !prevState.isDropdownOpen
    }));
  };
  
  openModal = () => {
    this.setState({ isModalOpen: true });
  };

  // Method to close the modal
  closeModal = () => {
    this.setState({ isModalOpen: false });
  };
  async componentDidMount() {
    try {
      this.timerInterval = setInterval(() => {
        this.setState((prevState) => ({
          timer: prevState.timer - 1,
        }));
        if (this.state.timer === 0) {
          clearInterval(this.timerInterval); // Stop the timer when it reaches 0
          this.setState({ loading: false }); // Set loading to false
          this.loadMarketplaceItems(); // Load marketplace items
        }
      }, 1000); 
      // Check if MetaMask is installed
      if (window.ethereum) {
        // Request Ethereum wallet access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        if (accounts.length > 0) {
          // User has connected their wallet
          this.setState({ isWalletConnected: true });
  
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const signerAddress = await signer.getAddress();
  
          // Create a contract instance
          const contract = new ethers.Contract(
            this.state.contractAddress,
            this.state.contractABI,
            signer
          );
  
          // Initialize market contract separately
          const market_contract = new ethers.Contract(
            this.state.market_contractAddress,
            this.state.market_contractABI,
            signer
          );
  
          this.setState({ contract, market_contract, signerAddress });
  
          const tokenCount = await contract.count();
          this.setState({ tokenCount: tokenCount.toString() });
  
          // Load marketplace items only if the wallet is connected
          this.loadMarketplaceItems();
        } else {
          // User chose not to connect their wallet
          console.warn('User chose not to connect their wallet.');
        }
      } else {
        console.warn('MetaMask or compatible Ethereum wallet not found.');
        // Handle the case where MetaMask is not available
        
          // Specify the RPC (Remote Procedure Call) endpoint URL for an Ethereum provider
          const RPC = process.env.REACT_APP_RPC ;
        
          // Create a JsonRpcProvider instance to connect to the Ethereum node
          const provider = new ethers.providers.JsonRpcProvider(RPC);
        
          // Create an instance of the Contract class representing the smart contract
          // Takes the contract address, contract ABI, and the provider as arguments
          const market_contract = new ethers.Contract( this.state.market_contractAddress,
            this.state.market_contractABI, provider);
          const contract = new ethers.Contract( this.state.contractAddress,
            this.state.contractABI, provider);
          this.setState({ contract, market_contract });
          
          const tokenCount = await contract.count();
          this.setState({ tokenCount: tokenCount.toString() });
  
          this.loadMarketplaceItems();
          // Return the created contract instance
          //return icoContract;
        }
      }
     catch (error) {
      // Define a function that returns an Ethereum contract instance


      console.error('Error connecting to Ethereum:', error);
    }
  }
  
   loadMarketplaceItems = async () => { 
    try{
    

    const { market_contract, contract} = this.state;
    let itemCount = await market_contract.itemCount()
    console.log('itemCount :',itemCount);
    let items = [];
    for (let i = 20; i <= itemCount.toNumber(); i++) {
      const item = await market_contract.items(i)
      
      if (!item.sold) {
       
       const tokenId = item[2].toString();
       console.log("tokenId:",tokenId);
      
        const uri = await contract.tokenURI(tokenId)
        const response = await fetch(uri);
        const metadata = await response.json()
  
       
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${uri}. Status: ${response.status}`);
          };
         
        // get total price of item (item price + fee)
        const totalPrice = await market_contract.getTotalPrice(item.itemId)
        // Add item to items array
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image                  
        })
        

      }
      
   }


    this.setState({ items, loading: false });
   
  }

  catch (error) {
    console.error('Error loading marketplace items:', error);
  }}
  
  

   buyMarketItem = async (item) => {
    try {
        await (await this.state.market_contract.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
        this.loadMarketplaceItems(); // Call the function within the component using this
      } catch (error) {
        console.error('Error buying marketplace item:', error);
      }
  }
  // Add the handleBuyButtonClick method to your component
handleBuyButtonClick = async (item) => {
  const { signerAddress } = this.state;
  // Check if signerAddress is null
  if (signerAddress === null) {
    // If null, show an alert to connect the wallet
    window.alert('Please connect your Goerli test Ethereum wallet (e.g., MetaMask).');
  } else {
    // If not null, proceed with the buy logic
    await this.buyMarketItem(item);
  }
}
  
  

render() {
  const { tokenCount, isWalletConnected, items, signerAddress, loading } = this.state;

  return (
    <div className="container">
      <div className="navbar">
        <div className="logo">NFT Marketplace</div>
        <ul className="nav-links">
          <li><a href="#" onClick={this.openModal}>Mint and list NFTs</a></li>
          <li><a href="#" onClick={this.toggleDropdown}>Wallet</a></li>
        </ul>
      </div>
      <div className="dropdown">
        {this.state.isDropdownOpen && (
          <div className="dropdown-content">
             <a> Wallet Connected: </a>  <br />
            <a> {signerAddress }</a>  <br />
            <a href="https://sakshi-1604.github.io/myNFT/">My NFT Status</a>  <br />
           
          </div>
        )}
      </div>
      <div className='heading'>
        <div className="logo-container">
          <img src={logo} alt="NFT Marketplace Logo" style={{ float: 'right' }} className="logo-image" />
        </div>
        <div className="title-container">
          <h1 className="title" style={{ letterSpacing: '4px' }}> 
            Discover  <br />  Collect   &nbsp; Sell  <br /> rare &nbsp; NFTS
          </h1>
        </div>
      </div>
      {isWalletConnected ? (
        <div className="wallet-info">
          <p></p>
        </div>
      ) : (
        <p className="wallet-info">
          Please connect your Goerli testnet Ethereum wallet (MetaMask).
        </p>
      )}
      {loading ? (
        <div className="loading">
          <p>Loading...</p>
          {/* Display the countdown timer */}
          <p>{this.state.timer} seconds remaining</p>
      
        </div>
      ) : (
        <div>
          {isWalletConnected ? (
            <div className="wallet-info">
              
            </div>
          ) : (
            <p className="wallet-info">
                </p>
          )}
         
          {this.state.isModalOpen && <Modal onClose={this.closeModal} />}
          <div className="collections">EXPLORE <br/> OUR <br/> COLLECTIONS </div>
          <div className="item-container">
            {items.map((item, idx) => (
              <Card key={idx} style={{ flex: '0 0 calc(25% - 20px)', margin: '10px' }} className="item-card">
                <Card.Img className='image' variant="top" src={item.image}  />
                <Card.Body className="item-body">
                  <Card.Title className="item-title">{item.name}</Card.Title>
                  <Card.Text className="item-description">
                    {item.description}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="item-footer">
                  <div className="item-price">
                    <img src={ether} alt="Ether" style={{ marginRight: '3px' }} className="ether-image" />
                    {ethers.utils.formatEther(item.totalPrice)} ETH
                  </div>
                  <Button
                    onClick={() => this.handleBuyButtonClick(item)}
                    variant="primary"
                    size="lg"
                    className="item-buy-button"
                  >
                    Buy Now
                  </Button>
                </Card.Footer>
              </Card>
            ))}
          </div>
          <div className="join-us">
            <h2>Join Us</h2>
          <div className="join-us-links">
            <a href="mailto:sddahake16@gmail.com" className="join-us-link">Email</a>
            <a href="https://www.linkedin.com/in/sakshi-dahake-b10782195/" className="join-us-link">LinkedIn</a>
            <a href="https://twitter.com/Sakshi16041" className="join-us-link">Twitter</a>
          </div>

          </div>
        </div>
      )}
    </div>
  );
}


}


export default ContractInteraction;

   