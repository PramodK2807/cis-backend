const express = require('express');
const app = express();
const cors = require('cors');
const JWT = require('jsonwebtoken');
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3100

require('./db/config')

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const UserModel = require('./models/UserModel');
const hashPassword = require('./helper/authHelper');
const { compare } = require('bcrypt');



app.get('/', (req, res) => {
    res.send("Hello")
})


app.post('/register', async(req, res) => {
    let {name, email, password} = req.body;
    if (!name || !email || !password ) {
        return res.status(500).send({
            success: false,
            message : "Please enter all details"
        })
    }

    try {
        // Check Existing User
        let existingUser = await UserModel.findOne({email})
        if(existingUser){
            return res.status(200).send({
                success: false,
                message : "Email already registered",
            })
        }

        let hashedPassword = await hashPassword(password)

        let user = await new UserModel({
            name, 
            email, 
            password:hashedPassword
        })

        await user.save()
        res.status(200).send({
            success: true,
            message: "User Registered Successfully",
            user
        })

    } 
    catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message : "Error while registration"
        })
    }
});


// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user already exists
        const user = await UserModel.findOne({ email })
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not registered or Invalid",

            })
        }
        if (!password || !email) {
            return res.status(404).send({
                success: false,
                message: "Please Enter email and password",

            })
        }

        const matchPassword = await compare(password, user.password)
        if (!matchPassword) {
            return res.status(404).send({
                success: false,
                message: "Invalid password",
            })
        }

        // generate token 

        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

        res.status(200).send({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            token
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: "Invalid Credentials",
            error,
        })
    }
})

app.patch('/update/:id', async(req, res) => {
    let {name, email, password} = req.body;
    // console.log(password)
    try {
        
        // let updateUser = await UserModel.findByIdAndUpdate({_id: req.params.id})
        // console.log(updateUser)
        // if(updateUser){
            let hashedPassword = await hashPassword(password)

            let user = await UserModel.updateOne(
                {_id: req.params.id},
                {$set: {email, password:hashedPassword, name}}
            )
            res.status(200).send({
                success: true,
                message: "Profile Update Successfully",
                user:{
                    _id:req.params.id,
                    name:name,
                    email:email,
                    // password:hashedPassword
                }
            })
        // }
        

    } 
    
    catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message : "Error while update"
        })
    }
});


app.listen(PORT)