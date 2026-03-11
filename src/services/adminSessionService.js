const crypto = require("crypto");

const sessions = new Map();

function createSession(email) {
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, { email, createdAt: Date.now() });
    return token;
}

function hasSession(token) {
    return sessions.has(token);
}

function deleteSession(token) {
    sessions.delete(token);
}

module.exports = {
    createSession,
    hasSession,
    deleteSession,
};
