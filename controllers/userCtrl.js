const expressAsyncHandler = require('express-async-handler');
const uniqid = require('uniqid');
const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel');
const validateMongoId = require('../utils/validateMongoDbid');
const { generateRefreshToken } = require('../config/refreshToken');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./emailCtrl');
const crypto = require('crypto');

const createUser = expressAsyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email: email });
    if (!findUser) {
        //create new user
        const newUser = await User.create(req.body);
        res.json(newUser);
    } else {
        //user already exists
        throw new Error("user already exists");

    };
});

//login User

const loginUser = expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    //check if user exists or not
    const findUser = await User.findOne({ email });
    if (findUser && await findUser.isPasswordMatched(password)) {
        const refreshToken = await generateRefreshToken(findUser?.id);
        const updatedUser = await User.findByIdAndUpdate(
            findUser?.id,
            {
                refreshToken: refreshToken
            },
            {
                new: true
            });
        res.cookie('refreshToken', refreshToken,
            {
                httpOnly: true,
                maxAge: 72 * 60 * 60 * 1000
            });
        res.json(
            {
                id: findUser?._id,
                firstName: findUser?.firstName,
                lastName: findUser?.lastName,
                email: findUser?.email,
                mobile: findUser?.mobile,
                token: generateToken(findUser?._id)
            }
        );
    } else {
        throw new Error("Invalid Credentials");
    };
});

//login admin

const loginAdminCtrl = expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    //check if user exists or not
    const findAdmin = await User.findOne({ email });
    if (findAdmin.role !== 'admin') throw new Error("not Authorized");
    if (findAdmin && await findAdmin.isPasswordMatched(password)) {
        const refreshToken = await generateRefreshToken(findAdmin?.id);
        const updatedAdmins = await User.findByIdAndUpdate(
            findAdmin?.id,
            {
                refreshToken: refreshToken
            },
            {
                new: true
            });
        res.cookie('refreshToken', refreshToken,
            {
                httpOnly: true,
                maxAge: 72 * 60 * 60 * 1000
            });
        res.json(
            {
                id: findAdmin?._id,
                firstName: findAdmin?.firstName,
                lastName: findAdmin?.lastName,
                email: findAdmin?.email,
                mobile: findAdmin?.mobile,
                token: generateToken(findAdmin?._id)
            }
        );
    } else {
        throw new Error("Invalid Credentials");
    };
});


//to get all the users

const getAllUsers = expressAsyncHandler(async (req, res) => {
    try {
        const allUsers = await User.find();
        res.json(allUsers);
    } catch (err) {
        throw new Error(err);
    };
});

//to get a single user

const getUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    try {
        const foundUser = await User.findById(id);
        res.json({
            foundUser
        });
    } catch (err) {
        throw new Error(err);
    };
});

//delete user

const deleteUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        res.json({
            deletedUser
        });
    } catch (err) {
        throw new Error(err);
    };
});

//update user

const updateUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.user;
    validateMongoId(id);

    try {
        const updateUser = await User.findByIdAndUpdate(id,
            {
                firstName: req?.body?.firstName,
                lastName: req?.body?.lastName,
                email: req?.body?.email,
                mobile: req?.body?.mobile
            },
            {
                new: true
            }
        );
        res.json(updateUser);

    } catch (err) {
        throw new Error(err);
    };

});

//save address

const saveAddress = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoId(_id);
    try {
        const { address } = req.body;
        const foundUser = await User.findById(_id);
        if (foundUser.address.includes(address)) {
            return res.status(400).json({ message: 'Address already exists' });
        };
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            {
                $push: { address: { $each: [address] } },
            },
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        throw new Error(err);
    }
});


//block user

const blockUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);

    try {
        const block = await User.findByIdAndUpdate(
            id,
            {
                blocked: true
            },
            {
                new: true
            });
        res.json({
            message: "user is blocked",
        });
    }
    catch (err) {
        throw new Error("there was some error while blocking the user", err);
    }
});

//to unblock a user

const unblockUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);

    try {
        const unblock = await User.findByIdAndUpdate(
            id,
            {
                blocked: false
            },
            {
                new: true
            });
        res.json({
            message: "user is unblocked",
        })
    }
    catch (err) {
        throw new Error("there was some error while unblocking the user", err);
    }
});

//to handle refresh token

const handleRefreshToken = expressAsyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("There is no refresh token in the cookies");
    const refreshToken = cookie.refreshToken;
    console.log(refreshToken);
    const user = await User.findOne({ refreshToken });
    if (!user) throw new Error("No user with this refresh token is found!");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error("There is something wrong with refresh token");
        };
        const accessToken = generateToken(user?._id);
        res.json({ accessToken });
    });
});

// to logout user

const logoutUser = expressAsyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("There is no refresh token in the cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        req.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true
        });
        res.sendStatus(204);
    };
    await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: ""
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true
    });
    res.sendStatus(204);
});

//to change password

const changePassword = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    const user = await User.findById(_id);
    validateMongoId(_id);
    if (password) {
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    } else {
        res.json(user);
    }
});

//reset password if forgot

const forgetPasswordToken = expressAsyncHandler(async (req, res) => {
    const { email } = req.user;
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");
    try {
        const token = await user.generateResetToken();
        await user.save();
        const resetUrl = `Hey, click on this link to reset password. This link is valid for 10mins. <a href='http//localhost:3000/api/u/reset-password/${token}'>click</a>`;
        const data = {
            to: email,
            subject: 'reset password',
            text: 'Hey, this is to reset your password',
            html: resetUrl,
        };
        sendEmail(data);
        res.json(token);
    } catch (err) {
        throw new Error(err);
    }
});

//reset password

const resetPassword = expressAsyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = await crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpired: { $gt: Date.now() }
    });
    if (!user) throw new Error("token expired!");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    user.save();
    res.json(user);
});


module.exports = {
    createUser,
    loginUser,
    getAllUsers,
    getUser,
    deleteUser,
    updateUser,
    blockUser,
    unblockUser,
    handleRefreshToken,
    logoutUser,
    changePassword,
    forgetPasswordToken,
    resetPassword,
    loginAdminCtrl,
    saveAddress,
};