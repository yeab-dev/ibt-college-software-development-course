const makeCounter = () => {
    let count = 0;

    return () => {
        count++;
        return count;
    };
};

const counter = makeCounter();

console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3