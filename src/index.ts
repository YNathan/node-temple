
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import routes from './routes';
import express, { Router } from "express";
// initialize configuration
dotenv.config();

// port is now available to the Node.js runtime
// as if it were an environment variable
const port = process.env.SERVER_PORT;

/* Express with CORS */
const app = express()


// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Instead of body parser
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cors({ origin: true }));

app.get("/", (req, res) => {
    // render the index template
    res.render("index");
});


app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})



app.use(routes);

app.listen(port, () => { console.log(`work on port ${port}`) })