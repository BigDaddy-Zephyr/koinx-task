
var express = require('express');
const axios = require('axios');
const { response } = require('express');
const mongoose = require("mongoose");
var router = express.Router();
require('dotenv').config();
var cron = require('node-cron');

mongoose.connect(
  process.env.MONGODB_URI, 
  {
      useNewUrlParser: true,
      useUnifiedTopology: true
  }
);

const priceSchema = new mongoose.Schema({
  name:String,
  price:Number
},
  {timestamps:true})

const transactionSchema = new mongoose.Schema({
  blockNumber: Number,
  timestamp: Number,
  hash: String,
  nonce: Number,
  blockHash:String,
  transactionIndex:Number,
  from:String,
  to:String,
  value:Number,
  gas:Number,
  gasPrice:Number,
  isError:Number,
  txreciept_status:Number,
  input:String,
  contractAddress:String,
  cumulativeGasUsed:Number,
  gasUsed:Number,
  confirmations:Number,
  methodId:String,
  functionName:String,
});

const userSchema= new mongoose.Schema({
  address:String,
  transactions:[transactionSchema]
})

const Price = mongoose.model('Price',priceSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const User = mongoose.model('User',userSchema);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//Task 1
router.get('/transactions',async(req,res)=>{
  let transaction = await axios.get('https://api.etherscan.io/api?module=account&action=txlist&address='+req.body.address+'&startblock=0&endblock=99999999&sort=asc&apikey='+process.env.API_URL)
   let doc= await User.findOneAndUpdate({address:req.body.address},{$set:{transactions:transaction.data.result}},{upsert: true, new: true})
    res.send(doc)
})

//Task 2
cron.schedule('* * * * *', async() => {
  let price = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr')
  const priceUpdate = new Price({name:"Ethereum", price:price.data.ethereum.inr})
  priceUpdate.save().then(() => console.log("Entry added"))

});

//Task 3
router.get('/balance',async(req,res)=>{
  let balance=0
  let price = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr')
  let transactions =await User.find({address:req.body.address})

   let values= transactions[0].transactions.map((transaction)=>{
    if (transaction.to==req.body.address){
      balance=balance+parseInt(transaction.value)
    }
    else{
      balance=balance-parseInt(transaction.value)
    }
  })
  res.json({data:{balance:balance,price:price.data.ethereum.inr}})
})

module.exports = router;