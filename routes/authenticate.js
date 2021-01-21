require('dotenv').config();
const express=require('express')
const router=express.Router();
const bcrypt = require ('bcrypt');
const crypto=require('crypto');
const bodyparser=require('body-parser');
const User = require('../models/schema');
const bodyparserurl=bodyparser.urlencoded({extended:false})
const sgmail=require('@sendgrid/mail')
sgmail.setApiKey(process.env.API_KEY)

router.get('/register',(req,res)=>{
    res.render('register')
})

router.get('/login',(req,res)=>{
    res.render('login')
})

router.get('/verify-info',(req,res)=>{
    User.findOne({email:req.session.email})
    .then((userdata)=>{
        res.render("verifyinfo",{email:userdata.email})  
    })
    
})

router.get('/home',(req,res)=>{
    User.findOne({email:req.session.email})
    .then((userdata)=>{
        if(userdata==null){
            res.render('home');
        }
        else{
            res.render('home',{userdata:userdata})
        }
    })
    .catch((err)=>console.log(err));
})

router.post('/register',bodyparserurl,async (req,res)=>{
    const errors=[];
    const data={
        username:req.body.username,
        email:req.body.email,
        emailToken:crypto.randomBytes(64).toString("hex"),
        isVerified:false,
        password:req.body.password,
    }
    if(!data.username || !data.email || !data.password){
        errors.push({msg:"Please fill in all fields"});
    }
    if(errors.length>0){
        res.render('register',{errors:errors,data:data});
    }
    else{
        User.findOne({email:data.email})
        .then(async (userdata)=>{
            if(userdata){
                errors.push({msg:"User already exists"});
                res.render('register',{errors:errors});
            }
            else{
                bcrypt.genSalt(10,(err,salt)=>{
                    bcrypt.hash(data.password,salt,async (err,hash)=>{
                        if (err) throw err;
                        data.password=hash;
                        try{
                            await User.create(data)
                            req.session.email=data.email;
                        }
                        catch(err){
                            res.send(err);
                        }
                    })
                });
                const msg={
                    to:data.email,
                    from:{
                        name:'Clanity',
                        email:"surveshubham10@gmail.com"
                    },
                    subject:"verify email",
                    text:`
                        Please verify your email to continue
                        Click on the link below or paste it in another tab
                        http:/${req.headers.host}/verify-email/?token=${data.emailToken}`,
                    html:`
                        <h1>Please verify your email to continue</h1>
                        <p>Click on the link below or paste it in another tab</p>
                        <a target="_blank" href="http:/${req.headers.host}/verify-email/?token=${data.emailToken}">Verify email</a>`
                }
                try{
                    await sgmail.send(msg)
                    res.redirect('/verify-info')
                }
                catch(err){
                    console.log(err)
                    res.redirect('/verify-info')
                }
            }
        })
        .catch((err)=>res.send(err));
    }
})

router.get('/verify-email',async (req,res)=>{
    try{
        const user=await User.findOne({emailToken:req.query.token})
        if(!user){
            res.send("user does not exist or invalid token")
        }
        else{
            // user.emailToken=null;
            user.isVerified=true;
            user.save()
            .then((userdata)=>{
                res.redirect('/home')
            })
            .catch((err)=>{
                res.send(err);
            })
        }
    }
    catch{
        console.log(err);
        res.redirect('/verify-info')
    }
})

router.post('/login',bodyparserurl,(req,res)=>{
    const errors=[];
    const data={
        email:req.body.email,
        password:req.body.password
    }
    if(!data.email || !data.password){
        errors.push({msg:"Please fill in all fields"})
        res.render('login',{errors:errors});
    }
    else{
        User.findOne({email:data.email})
        .then(async (userdata)=>{
            if(userdata){
                bcrypt.compare(req.body.password,userdata.password,async (err,isMatch)=>{
                    if (err) throw err;
                    if(isMatch){
                        if(userdata.isVerified){
                            req.session.email=data.email;
                            res.redirect('/home');
                        }
                        else{
                            const msg={
                                to:data.email,
                                from:{
                                    name:'Clanity',
                                    email:"surveshubham10@gmail.com"
                                },
                                subject:"verify email",
                                text:`
                                    Please verify your email to continue
                                    Click on the link below or paste it in another tab
                                    http:/${req.headers.host}/verify-email/?token=${userdata.emailToken}`,
                                html:`
                                    <h1>Please verify your email to continue</h1>
                                    <p>Click on the link below or paste it in another tab</p>
                                    <a target="_blank" href="http:/${req.headers.host}/verify-email/?token=${userdata.emailToken}">Verify email</a>`
                            }
                            try{
                                await sgmail.send(msg)
                                res.redirect('/verify-info')
                            }
                            catch(err){
                                console.log(err)
                                res.redirect('/verify-info')
                            }
                        }
                    }
                    else{
                        errors.push({msg:"Incorrect Password"});
                        res.render('login',{errors:errors});
                    }
                })
            }
            else{
                errors.push({msg:"User does not exist"})
                res.render('login',{errors:errors})
            }
        })
        .catch((err)=>res.send(err));
    }
})


module.exports=router;