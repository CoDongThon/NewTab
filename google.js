function gemini(model, apiKey, json) {
    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(json),
        }
    ).then(x => x.json());
}

export {
    gemini,
};