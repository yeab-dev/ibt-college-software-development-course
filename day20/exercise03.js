async function testWrongUrl() {
    try {
        const res = await fetch(
            "https://this-definitely-does-not-exist-12345.com"
        );

        console.log(res);
    } catch (error) {
        console.log("Catch ran:", error.message);
    }
}

testWrongUrl();

async function test404() {
    try {
        const res = await fetch(
            "https://jsonplaceholder.typicode.com/posts/999999"
        );

        console.log("fetch resolved");
        console.log("status:", res.status);
        console.log("ok:", res.ok);

        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }

        const data = await res.json();
        console.log(data);

    } catch (error) {
        console.log("Catch:", error.message);
    }
}

test404();