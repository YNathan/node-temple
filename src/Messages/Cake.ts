export class Cake{
    private chocolatAmount: number;
    constructor(){
        console.log(`a new cake is maded`)
    }

    public getChocolate(): number{
        return this.chocolatAmount;
    }

    public setChocolate(chocolate: number){
        this.chocolatAmount = chocolate;
    }
}