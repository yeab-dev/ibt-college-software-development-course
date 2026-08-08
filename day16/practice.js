const readline = require('readline');
rl = readline.createInterface({input: process.stdin, output: process.stdout});
rl.question("Please enter the Bill\n",(amt) => {
    let bill;
    let partyCount;
    let total;
    let tip = 0;
    let perPerson;
    let serviceFee = 0;
    let paymentMethod = 'cash';
    rl.question("How many of you are there?\n", (count)=>{
        
        partyCount = Number(count);
        bill = Number(amt);
        if (bill >= 300){
            tip = bill * 0.1;
        }
        
        switch(paymentMethod){
            case ('TELEBIRR'):
                serviceFee = 0.1
                break;
                case ('CBEBIRR'):
                    serviceFee = 0.01
                    break;
                }

            total = bill + tip + serviceFee;
            perPerson = total/partyCount;

        console.log(`Total: ${total}\nPer person: ${perPerson}\nService Fee: ${serviceFee}`)
        rl.close();
    })


});