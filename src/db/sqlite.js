const { execFileSync } = require("child_process");
const path = require("path");
const { DB_PATH } = require("../config/env");

const resolvedDbPath = path.resolve(DB_PATH);

function escapeValue(value) {
    if (value === null || value === undefined) {
        return "NULL";
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : "NULL";
    }

    if (typeof value === "boolean") {
        return value ? "1" : "0";
    }

    return `'${String(value).replace(/'/g, "''")}'`;
}

function interpolate(sql, params = []) {
    let index = 0;
    return sql.replace(/\?/g, () => escapeValue(params[index++]));
}

function executeRaw(sql) {
    execFileSync("sqlite3", [resolvedDbPath, sql], { stdio: "pipe" });
}

function query(sql, params = []) {
    const statement = interpolate(sql, params);
    const output = execFileSync("sqlite3", ["-json", resolvedDbPath, statement], {
        encoding: "utf8",
        stdio: "pipe",
    });

    if (!output.trim()) {
        return [];
    }

    return JSON.parse(output);
}

function run(sql, params = []) {
    const statement = interpolate(sql, params);
    executeRaw(statement);
}

module.exports = {
    resolvedDbPath,
    run,
    query,
    executeRaw,
};
