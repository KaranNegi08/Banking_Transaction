const mongoose= require("mongoose");

 const transactionSchema= new mongoose.Schema({
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true, "From account is required"],
        index:true
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true, "To account is required"],
        index:true
    },
    amount:{
        type:Number,
        required:[true, "Amount is required"],
        min:[0.01, "Amount must be at least 0.01"]
    },
    status:{
        type:String,
        enum:{
            values:["PENDING", "COMPLETED","FAILED", "REVERSED"],
            message:"Status must be either PENDING, COMPLETED or FAILED"
        },
        default:"PENDING"
    },
    idempotencyKey:{
        type:String,
        required:[true, "Idempotency key is required"],
        unique:true,
        index:true
    }

},{
    timestamps:true 
});

const transactionModel= mongoose.model("Transaction", transactionSchema);

module.exports= transactionModel;