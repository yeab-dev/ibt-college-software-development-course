function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function load(key) {
    try {
        const data = localStorage.getItem(key);

        if (data === null) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}