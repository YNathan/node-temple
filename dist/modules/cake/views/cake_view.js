"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRoutes = void 0;
const Utils_1 = require("../../../Utils");
const cake_ctrl_1 = require("../controller/cake_ctrl");
function addRoutes(router) {
    router.GET("/cake/:cakeId", `
           a cake is asked
        `, "Cake", (params) => __awaiter(this, void 0, void 0, function* () {
        const cakeId = yield Utils_1.getWebUrlFromParam(params, "cakeId");
        const blablas = yield cake_ctrl_1.getCakeChocolateAmount();
        return new Promise((resolve, rejects) => {
            return cake_ctrl_1.getCake();
        });
    }));
}
exports.addRoutes = addRoutes;
//# sourceMappingURL=cake_view.js.map