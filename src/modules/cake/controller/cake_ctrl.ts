import * as Cake from "../../../Messages/Cake";
import * as messages from "../../../Messages";

export function getCakeChocolateAmount(): Promise<number | null> {
    const cake = new Cake.Cake();
    return new Promise((resolve, reject) => {
        resolve(cake.getChocolate());
    })
}


export function setCakeChocolateAmount(chocolatAmount: number): Promise<void> {
    const cake = new Cake.Cake();
    return new Promise((resolve, reject) => {
        resolve(cake.setChocolate(chocolatAmount));
    })
}


export function getCake(): Promise<messages.Cake> {
    const cake = new Cake.Cake();
    return new Promise<messages.Cake>((resolve, rejects) => {
        cake.setChocolate(2);
        resolve(cake);
    })
}