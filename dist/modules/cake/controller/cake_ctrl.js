"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCake = exports.setCakeChocolateAmount = exports.getCakeChocolateAmount = void 0;
const Cake = __importStar(require("../../../Messages/Cake"));
function getCakeChocolateAmount() {
    const cake = new Cake.Cake();
    return new Promise((resolve, reject) => {
        resolve(cake.getChocolate());
    });
}
exports.getCakeChocolateAmount = getCakeChocolateAmount;
function setCakeChocolateAmount(chocolatAmount) {
    const cake = new Cake.Cake();
    return new Promise((resolve, reject) => {
        resolve(cake.setChocolate(chocolatAmount));
    });
}
exports.setCakeChocolateAmount = setCakeChocolateAmount;
function getCake() {
    const cake = new Cake.Cake();
    return new Promise((resolve, rejects) => {
        cake.setChocolate(2);
        resolve(cake);
    });
}
exports.getCake = getCake;
//# sourceMappingURL=cake_ctrl.js.map