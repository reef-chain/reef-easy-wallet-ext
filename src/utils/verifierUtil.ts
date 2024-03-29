export const getShortenedVerifier= (verifier:string|undefined):string=>{
    // unknown is passed
    if(!verifier)return "unknown";
    // if email
    else if(verifier.includes("@") && verifier.split("@").length==2){
        const [first,last] = verifier.split("@");
        return first.slice(0,3)+"..@.."+last.slice(2);
    }
    return verifier;
}