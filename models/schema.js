const mongoose=require('mongoose');
const Userschema=new mongoose.Schema({
    username: String,
	password: String,
	email   : String,
	emailToken: String,
	isVerified: Boolean,
	passwordStore: String
})

const User=mongoose.model("users",Userschema);

module.exports=User;