const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");



// require('dotenv').config();
// const passport = require("passport");
// const session = require("express-session");
// require("./passport");


const port = 4002;


const cors = require("cors");
const app = express();

//MiddleWares
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cors());

// // Added middlewares to implement google sign
// app.use(session({
// 	secret: process.env.clientSecret,
// 	resave: false,
// 	saveUninitialized:  false
// }))

// app.use(passport.initialize());
// app.use(passport.session());

// mongodb+srv://admin:admin@b335-glemao.od57ehx.mongodb.net/postmanCartHub
// mongodb+srv://admin:admin@b335-celeridad.au92cmr.mongodb.net/FragsHubPH

mongoose.connect("mongodb+srv://admin:admin@b335-celeridad.au92cmr.mongodb.net/FragsHubPH",
	{
		useNewUrlParser : true,//for parsing/reading connection string
		useUnifiedTopology : true//assures that we uses the updated mongoDB servers
	}
)

mongoose.connection.once('open', () => console.log ('Now connected to MongoDB Atlas'));

app.get("/b2", (req, res) => {
	res.send("Hello world")
})

app.use("/b2/users", userRoutes);
app.use("/b2/products", productRoutes);


app.listen(process.env.PORT || port, () => {console.log(`API is now online on port ${process.env.PORT || port}`)});