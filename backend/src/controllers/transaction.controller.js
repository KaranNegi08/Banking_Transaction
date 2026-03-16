const transactionModel= require("../models/transaction.model.js");
const ledgerModel= require("../models/ledger.model.js");
const accountModel= require("../models/account.model.js");
const emailService= require("../services/email.service.js");
const mongoose= require("mongoose");

async function createTransaction(req,res){

    // 1. VALIDATE REQUEST

    const {fromAccount, toAccount, amount,idempotencyKey }= req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({message:"fromAccount, toAccount, amount and idempotencyKey are required"});
    }

    const fromUserAccount= await accountModel.findOne({
        _id:fromAccount,
    });

    const toUserAccount= await accountModel.findOne({
        _id:toAccount,
    });
    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({message:"From account or To account not found"});
    }

    // VALIDATE IDEMPOTENCY KEY

    const isTransactionAlreadyExists= await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    });

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status==="COMPLETED"){
            return res.status(200).json({message:"Transaction already completed", transaction:isTransactionAlreadyExists});
        }else if(isTransactionAlreadyExists.status==="PENDING"){
            return res.status(200).json({message:"Transaction is still pending", transaction:isTransactionAlreadyExists});
        }else if(isTransactionAlreadyExists.status==="FAILED"){
            return res.status(200).json({message:"Transaction already failed", transaction:isTransactionAlreadyExists});
        }else if(isTransactionAlreadyExists.status==="REVERSED"){
            return res.status(200).json({message:"Transaction already reversed", transaction:isTransactionAlreadyExists});
        }
    }

    // CHECK ACCOUNT STATUS
    if(fromUserAccount.status !=="ACTIVE" || toUserAccount.status !=="ACTIVE"){
        return res.status(400).json({message:"Both accounts must be active to perform a transaction"});
    }

    const balance = await fromUserAccount.getBalance();
    if(balance<amount){
        return res.status(400).json({message:`Insufficient balance. Current Balance is ${balance}`});
    }

    //  CREATE TRANSACTION
    const session= await mongoose.startSession();
    session.startTransaction();

    const transaction= await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    },{session});
    
    const debitLedgerEntry= await ledgerModel.create({
        account:fromAccount,
        type:"DEBIT",
        amount:amount,
        transaction:transaction._id
    },{session});

    const creditLedgerEntry= await ledgerModel.create({
        account:toAccount,
        type:"CREDIT",
        amount:amount,
        transaction:transaction._id
    },{session});
     
    transaction.status="COMPLETED";
    await transaction.save({session});

    await session.commitTransaction();
    session.endSession();

    // SEND NOTIFICATION EMAILS
    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        toAccount
    )
    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

}

module.exports={
    createTransaction
}