const loleArray = [1,2,3,4]

for (const element of [...loleArray]) {
    console.log(element);

    if(element == 2){
        loleArray.splice(loleArray.indexOf(2),1);
    }
    
}

//npx tsx test.ts