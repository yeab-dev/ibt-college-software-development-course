const output = document.querySelector("#output");
const button = document.querySelector("#loadBtn");

async function loadPost() {
    output.textContent = "Loading...";

    try {
        const res = await fetch(
            "https://jsonplaceholder.typicode.com/posts/1"
        );

        if (!res.ok) {
            throw new Error("Failed to load post");
        }

        const post = await res.json();

        output.textContent = post.title;

    } catch (error) {
        output.textContent = "Something went wrong.";
    }
}

button.addEventListener("click", loadPost);