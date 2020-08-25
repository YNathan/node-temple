
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import express from "express";
// initialize configuration
dotenv.config();

// port is now available to the Node.js runtime
// as if it were an environment variable
const port = process.env.SERVER_PORT;

/* Express with CORS */
const app = express()


// Configure Express to use EJS
app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );


app.use( (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cors({ origin: true }));

app.get( "/", ( req, res ) => {
    // render the index template
    res.render( "index" );
} );

app.listen(5000,()=>{console.log("work")})