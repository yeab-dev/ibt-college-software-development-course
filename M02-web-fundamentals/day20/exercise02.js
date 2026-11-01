fetch("https://jsonplaceholder.typicode.com/posts/1")
    .then(res => res.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error(error);
    });

// The asyn-await version
async function getPost() {
    try {
        const res = await fetch(
            "https://jsonplaceholder.typicode.com/posts/1"
        );

        if (!res.ok) {
            throw new Error("Request failed");
        }

        const data = await res.json();

        console.log(data);
    } catch (error) {
        console.error(error.message);
    }
}

getPost();