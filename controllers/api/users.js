const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const password = require('passport');
const checkPerm = require('../../config/checkPerm');

//
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

//Tải user model
const User = require('../../models/User');

router.post('/register', (req, res) => {
    const {errors, isValid} = validateRegisterInput(req.body);
    if(!isValid){
        return res.status(400).json(errors);
    }
    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).json({
                stastatusCodetus: -1,
                message: 'Email đã được sử dụng, hãy chọn email khác',
                data: 0
            });
        } else {
            User.findOne({ name: req.body.name }).then(user => {
                if (user) {
                    return res.status(400).json({ 
                        statusCode: -1,
                        message: 'Nickname này đã được sử dụng, hãy chọn một tên khác',
                        data: 0
                    });
                } else {
                    const avatar = gravatar.url(req.body.email, {
                        s: '200', //size
                        r: 'pg', //rating
                        d: 'mm' //default
                    });
                    // Mã hóa       
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            if (err) throw err;
                            req.body.password = hash;
                            // Tạo mới 1 tài khoản
                            const newUser = new User({
                                email: req.body.email,
                                password: req.body.password,
                                name: req.body.name,
                                avatar,
                            });
                            newUser.save()                            
                            .then(user => res.json({
                                statusCode: 1,
                                message: 'Tạo mới thành công',
                                data: {
                                    email: user.email,
                                    name: user.name,
                                    avatar: user.avatar
                                }
                            })); //thông báo
                        });
                    });
                }          
            });
        };
    });
});
router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const {errors, isValid} = validateLoginInput(req.body);

    if(!isValid){
        return res.status(400).json(errors);
    }

    //Tìm tài khoản qua email
    await User.findOne({email}).then(user => {
        //Kiểm tra email
        if (!user) {
            return res.status(404).json({
                statusCode: -1,
                message: 'Tài khoản không tồn tại',
                data: 0
            });
        }
        else {
        User.findOne({email}).then(user => {
            if(user) {
        //Kiểm tra mật khẩu
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = {id: user.id, name: user.name, avatar: user.avatar, perm: user.permission}; //Tạo jwt payload
                //đăng nhập token, sau expiresIn mã sẽ hết hạn và phải đăng nhập lại
                jwt.sign(payload, keys.secretOrKey, {expiresIn: '10 days'},
                    (err, token) => {
                        res.json({
                            statusCode: 1,
                            message: 'Đăng nhập thành công',
                            token: 'Bearer ' + token
                        });
                    }
                );
            } else {
                return res.status(400).json({
                    statusCode: -1,
                    message:'Sai mật khẩu',
                    data: 0
                });
            }
        });}
        })}
    });
});
// Truy xuất thông tin tài khoản hiện tại
router.get('/current', password.authenticate('jwt', { session: false}), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
    });
});

module.exports = router;