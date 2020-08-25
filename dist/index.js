"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const express_1 = __importDefault(require("express"));
// initialize configuration
dotenv_1.default.config();
// port is now available to the Node.js runtime
// as if it were an environment variable
const port = process.env.SERVER_PORT;
/* Express with CORS */
const app = express_1.default();
// Configure Express to use EJS
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "ejs");
// Instead of body parser
app.use(express_1.default.json()); // Used to parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cors_1.default({ origin: true }));
app.get("/", (req, res) => {
    // render the index template
    res.render("index");
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
app.use(routes_1.default);
app.listen(port, () => { console.log(`work on port ${port}`); });
//# sourceMappingURL=index.js.map