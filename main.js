const express=require('express')
const mongoose=require('mongoose')
const session = require('express-session');
const bcypt=require('bcryptjs')
const sgmail=require('@sendgrid/mail')
sgmail.setApiKey(process.env.API_KEY)
require('dotenv').config();

const app=express();

app.set('view engine','ejs');
app.use(session({secret: "Shh, its a secret!",resave:false}));

const url="mongodb://localhost:27017/sendgrid";
mongoose.connect(url,{useNewUrlParser:true,useUnifiedTopology: true})
.then(()=>console.log("mongo db connected"))
.catch((err)=>console.log(err));

app.use('/',require('./routes/authenticate'))

app.listen(5000,()=>console.log("Server running"))
