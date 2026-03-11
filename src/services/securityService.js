const crypto = require("crypto");

function hashPassword(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, actualSalt, 100000, 64, "sha512")
        .toString("hex");

    return { salt: actualSalt, hash };
}

function verifyPassword(password, salt, expectedHash) {
    const { hash } = hashPassword(password, salt);
    return hash === expectedHash;
}

module.exports = {
    hashPassword,
    verifyPassword,
};
