export const formatePrice =(price: number): string=>{
    if( price>=10000000){
        const cr = (price/10000000).toFixed(1).replace(/\.0$/,"")
        return `₹${cr}Cr`;
    }
    if( price>=100000){
        const l = (price/100000).toFixed(1).replace(/\.0$/,"")
        return `₹${l}L`;
    }
    return `₹${price.toLocaleString()}`;
}