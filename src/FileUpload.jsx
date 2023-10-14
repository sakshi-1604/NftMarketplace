import React, { Component } from 'react';
import { ethers } from 'ethers';
import axios from 'axios'; 
import './fileUpload.css';

import marketAbi from './marketAbi.json'; 
import nftAbi from './nftAbi.json';

class ContractInteraction extends Component {
  constructor(props) {
    super(props);
    this.state = {

      contract: null,
      contractAddress : process.env.REACT_APP_NFT_ADD,
      contractABI : nftAbi,
     market_contract: null,
     market_contractAddress : process.env.REACT_APP_MARKET_ADD,
      market_contractABI : marketAbi,
      JWT: process.env.REACT_APP_JWT,
      tokenCount: 0, 
      BASE_URL : process.env.REACT_APP_BASE_URL,
      isSubmitting: false,
      isMinted: false,
      isApproved: false,
      isListed: false,
      isDone: false,
    //form
      file: null,
      name: '',
      description: '',
      external_url: '',
      price:'',
      provider: null,
      signer: null,
     
      isWalletConnected: false,
      cid : '',
  
    };
  }

  async componentDidMount() {
    try {
      // Connect to Ethereum provider (e.g., MetaMask)
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.setState({ isWalletConnected: true });

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Create a contract instance
        const contract = new ethers.Contract(
          this.state.contractAddress,
          this.state.contractABI,  
          signer
        );

        const market_contract = new ethers.Contract(
            this.state.market_contractAddress,
            this.state.market_contractABI, 
            signer
          );

        this.setState({ contract });
        this.setState({ market_contract });

        const tokenCount = await contract.count();
        this.setState({ tokenCount: tokenCount.toString() });
      } else {
        console.error('MetaMask or compatible Ethereum wallet not found.');
      }
    } catch (error) {
      console.error('Error connecting to Ethereum:', error);
    }
  }

  uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pinataMetadata', JSON.stringify({ name: 'pinnie' }));

      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
           'Authorization': `Bearer ${this.state.JWT}`,
        },
      });

      
      return res.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  uploadMetadata = async () => {
    const { name,BASE_URL, description, external_url, price, cid } = this.state;
    const imageCID = await this.uploadImage(this.state.file);

    try {
      const data = JSON.stringify({
        pinataContent: {
          name,
          description,
          external_url,
          image: `${BASE_URL}${imageCID}`,
          
          price,
        },
        pinataMetadata: {
          name: 'Pinnie NFT Metadata',
        },
      });
     
      const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
        headers: {
          'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.state.JWT}`,
        },
      });

     
    this.setState({ cid: res.data.IpfsHash });
    } catch (error) {
      
      console.error('Error uploading metadata:', error);
    }
  };

  handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.setState({ file: selectedFile });
    }
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  async mintToken() {
    try {
      this.setState({ isSubmitting: true });
  
      await this.uploadMetadata();
      this.setState({ isMinted: true });
  
      const { market_contract, contract, contractAddress, cid, BASE_URL, market_contractAddress, price } = this.state;
  
      // Example: Call a contract function to mint a tokenimage: 
      const tx = await contract.mint(`${BASE_URL}${cid}`);
      await tx.wait();
      this.setState({ isApproved: true });
  
      const id = await contract.tokenCount();
      console.log('Token count/id set', id.toString());
      await (await contract.setApprovalForAll(market_contractAddress, true)).wait();
      this.setState({ islisted: true });
  
      
      const listingPrice = ethers.utils.parseEther(price.toString());
      await (await market_contract.makeItem(contractAddress, id, listingPrice, cid)).wait();
      this.setState({ isDone: true });
     
  
      this.setState({ isSubmitting: false });
    } catch (error) {
      console.error('Error minting token:', error);
      this.setState({
        isSubmitting: false,
        isMinted: false,
        isApproved: false,
        isListed: false,
        isDone: false

      });
    }
  }
  
  render() {
    const { name, description, price,  isWalletConnected } = this.state;
    const {
      isSubmitting, isMinted, isApproved, isListed, isDone
    } = this.state;
  
    let statusMessage = '';
    let buttonElement = null;
  
    if (isMinted && isApproved && isListed && isDone) {
      statusMessage = 'Successfully minted and listed item!';
    }
    else if (isDone) {
      statusMessage = 'Done! Token minted and listed successfully';
    } 
    else if (isListed) {
      statusMessage = 'Accept metamask listing(contract interaction) request ...';
    } 
    else if (isApproved) {
      statusMessage = 'Accept metamask Approve request ...';
    } 

    else if (isMinted) {
      statusMessage = 'Accept metamask Minting request ...';
    } 
    else if (isSubmitting) {
      statusMessage = 'Starting...';
    } 
    else {
      buttonElement = (
        <button type="button" onClick={() => this.mintToken()}>
          Mint Token
        </button>
      );
    }
 
    return (
      <div className='main'>
        <h4>File Upload</h4>
        <div className='main2'>
        <form >
            <div className='form-field'>
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={name}
                onChange={this.handleInputChange}
              />
            </div>
  
            <div className='form-field'>
              <label>Description</label>
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={description}
                onChange={this.handleInputChange}
              />
            </div>
  
         
  
            <div className='form-field'>
              <label>Price</label>
              <input
                type="text"
                name="price"
                placeholder="Price"
                value={price}
                onChange={this.handleInputChange}
              />
            </div>
  
            <div className='form-field'>
              <label>Upload Image</label>
              <input
                type="file"
                accept=".jpg, .jpeg, .png, .gif"
                onChange={this.handleFileChange}
              />
            </div>
  
            <div className='mint-button'>
              {isWalletConnected ? (
                // Display different messages based on the state
                 isListed ? (
                  <p>Minted and Listed Succesfully</p>
                ) : (
                  <div className= 'status' >
                    {statusMessage && <p>{statusMessage}</p>}
                    {!statusMessage && buttonElement}
                  </div>
                )
              ) : (
                <button type="button" onClick={this.connectWallet}>
                  Connect Wallet
                </button>
              )}
            </div>

          </form>
  
       
  
          
        </div>
      </div>
    );
  }
  
  
}

  


export default ContractInteraction;

