async function getPosts() {
    const res = await fetch(
        "https://jsonplaceholder.typicode.com/posts"
    );

    if (!res.ok) {
        throw new Error("Failed to fetch posts");
    }

    return res.json();
}

async function getDetails() {
    const posts = await getPosts();

    const firstTwo = posts.slice(0, 2);

    const requests = firstTwo.map(post =>
        fetch(`https://jsonplaceholder.typicode.com/users/${post.userId}`)
            .then(res => res.json())
    );

    const users = await Promise.all(requests);

    console.log(users);
}

getDetails();