const jwt= require('jsonwebtoken');
const userModel = require('../models/user.model');

async function authMiddleware(req, res, next) {
    const token= req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded= jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user= await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized User...' });
        }

        req.user = user;
        next();
    }catch(error){
        console.log(error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports= {
    authMiddleware
}