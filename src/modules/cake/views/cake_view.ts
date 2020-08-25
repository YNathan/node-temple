import * as Router from "../../../Router";
import * as messages from "../../../Messages"
import { getWebUrlFromParam } from "../../../Utils";
import { getCakeChocolateAmount, getCake } from "../controller/cake_ctrl";
import { IRoute } from "express";

export function addRoutes(router: Router.Router<{}, {}, {}>) {
     router.GET(
        "/cake/:cakeId",
        `
           a cake is asked
        `,
        "Cake",
        async (params: any): Promise<messages.Cake> => {

            const cakeId = await getWebUrlFromParam(params,"cakeId");

            const blablas = await getCakeChocolateAmount();


            return  new Promise<messages.Cake>((resolve,rejects)=>{
                return getCake();
            });
        })
    }
