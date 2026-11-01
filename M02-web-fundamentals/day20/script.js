async function getUsers() {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const users = await response.json();

  const list = document.getElementById("users");

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user.name;
    list.appendChild(li);
  });
}

document.getElementById("loadUsers").addEventListener("click", getUsers);