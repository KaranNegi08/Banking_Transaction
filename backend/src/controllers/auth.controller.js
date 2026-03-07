const userModel= require('../models/user.model.js');
const jwt= require('jsonwebtoken');

async function userRegisterController(req,res){
    const {email, name, password} = req.body;

    if(!email || !name || !password){
        return res.status(400).json({
            success:false,
            message:"All fields are required"
        });
    }

    const isExists= await userModel.findOne({
        email:email
    })

    if(isExists){
        return res.status(422).json({
            message:"Email already exists. Please use a different email address",
            success:false
        })
    }
    const user= await userModel.create({
        email,
        name,
        password
    });

    const token= jwt.sign({
        userId:user._id
    }, process.env.JWT_SECRET_KEY, {expiresIn:"7d"});
    res.cookie("token", token);

    return res.status(201).json({
        success:true,
        message:"User registered successfully",
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    });

}

async function userLoginController(req,res){
    const {email, password} = req.body;
    const user= await userModel.findOne({email}).select("+password");
    if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        });
    }

const isValidPassword= await user.comparePassword(password);
if(!isValidPassword){
    return res.status(400).json({
        success:false,
        message:"Invalid password"
    });
}

const token= jwt.sign({
    userId:user._id
}, process.env.JWT_SECRET_KEY, {expiresIn:"7d"});
res.cookie("token", token);

return res.status(200).json({
    success:true,
    message:"User logged in successfully",
    user:{
        _id:user._id,
        email:user.email,
        name:user.name
    },
    token
});

}


module.exports = {
    userRegisterController,
    userLoginController
};