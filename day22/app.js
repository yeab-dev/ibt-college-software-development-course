const API = "https://open.er-api.com/v6/latest/ETB";
const KEY = "birrwatch";
const status = document.querySelector('#status')

const select = document.querySelector("#currency");
const form = document.querySelector('#convert-form');
const amount = document.querySelector('#amount');
const result = document.querySelector('#result');
const saveBtn = document.querySelector('#watch');
const watchUl = document.querySelector('#watchlist')

const state = {
    base: "ETB",
    rates: {},
    watchlist: [],
    amount: 100,
    currency: "USD"
}
async function init(){
    load();
    loadRates()
    render();
}
init();
async function loadRates(){
    status.textContent = "Loading rates..."
    try{
        const res = await fetch(API);
        if (!res.ok) throw new Error("HTTP " + res.status);
        status.textContent = ""
        const data = await res.json();
        state.rates = data.rates;
        render(); 
    }catch (e){
    status.textContent = "Couln't load rates.";
    }
}

function render(){

    const codes = Object.keys(state.rates);
    select.innerHTML = codes
        .map(c => `<option>${c}</option>`)
        .join("")
    select.value = state.currency
    renderWatchlist();
}


form.addEventListener("submit", (e) =>{
    e.preventDefault();
    const amt = Number(amount.value)
    console.log(amount.value)
    if(!amt || amt <= 0){
        result.textContent = "Please enter a valid amount.";
        return
    }
    state.currency = select.value;
    const rate = state.rates[state.currency];
    const out = (amt * rate).toFixed(2);
    result.textContent = `${amt} ETB = ${out} ${state.currency}`;
});

saveBtn.addEventListener("click", (e) => {
    const c = select.value;

    if(state.watchlist.includes(c)) return
    state.watchlist.push(c);
    save()
    renderWatchlist()
})

function renderWatchlist(){
    if(state.watchlist.length === 0){
        watchUl.innerHTML = "<li>No Saved Currencies Yet</li>"
        return;
    }
    watchUl.innerHTML = state.watchlist.map(c=> {
        const r = state.rates[c]
        return `<li data-c="${c}">1 ETB = ${r} ${c}
                <button class="rm"> × </button> </li>`;
    }).join("")
}
watchUl.addEventListener("click", (e)=>{
    if (!e.target.matches(".rm")) return;
    const c = e.target.closest("li").dataset.c;
    console.log(c)
    state.watchlist = state.watchlist.filter(x => x !== c);
    renderWatchlist();
    save()
})

function save(){
    localStorage.setItem(KEY, JSON.stringify({
        watchlist: state.watchlist,
        currency: state.currency,
    }));
}

function load(){
    const saved = localStorage.getItem(KEY)
    if (saved) Object.assign(state, JSON.parse(saved));
}


