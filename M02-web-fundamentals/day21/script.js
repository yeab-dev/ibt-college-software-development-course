const form = document.querySelector("#signup");
form.addEventListener("submit", (e)=>{
    const nameInput = document.querySelector("#name");
    const name = nameInput.value;
    const phone = phoneInput.value;
    const error = validate({name, phone})
    e.preventDefault();
    console.log(name.trim)
})

function validate({name, phone}){
    if (!name) return "Please enter your name"
    if (name.length < 2) return "Name too short"
    if (!phone) return "Phone is required"
    return "";
}
