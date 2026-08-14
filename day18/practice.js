const orders = [
    {id: 1, items: [{p:200, q:2}], vip: true},
    {id: 2, items: [{p:120, q:1}], vip: false}
]

const total = ({items}) => 
    items.reduce((s, {p, q}) => s + p*q, 0);

const report = orders
    .filter(o => o.vip)
    .map(o => ({...o, total: total(o)}))
    .map(o => `#${o.id}: ${o.total} ETB`);


console.log(report)