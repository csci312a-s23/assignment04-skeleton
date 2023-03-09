/* eslint-disable func-names */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
const fs = require("fs");

const contents = fs.readFileSync("./data/test-data.json");
const data = JSON.parse(contents);

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  // Use batch insert because we have too many articles for simple insert
  return knex("sqlite_sequence")
    .where("name", "=", "Article")
    .update({ seq: 0 })
    .then(() => knex("Article").del())
    .then(() => knex.batchInsert("Article", data, 100));
};
