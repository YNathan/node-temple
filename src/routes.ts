import { Router } from 'express';
import * as cakeView from "./modules/cake/views/cake_view"
import * as router from "./Router";
export const itemsRouter = Router();

const routes = Router();

// routes.use(cakeView.addRoutes(router));

export default routes;