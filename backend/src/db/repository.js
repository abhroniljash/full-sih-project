const { read, write } = require('./jsonDb');
const { randomUUID } = require('crypto');

/**
 * Generic helpers on top of jsonDb so controllers never touch the raw file.
 * Every write re-reads first, so concurrent requests always mutate the
 * latest data.
 */

function all(collection) {
  const data = read();
  return data[collection] || [];
}

function findOne(collection, predicate) {
  return all(collection).find(predicate) || null;
}

function findMany(collection, predicate) {
  return all(collection).filter(predicate);
}

async function insert(collection, record) {
  const data = read();
  const withId = { id: randomUUID(), createdAt: new Date().toISOString(), ...record };
  data[collection] = [...(data[collection] || []), withId];
  await write(data);
  return withId;
}

async function update(collection, predicate, updates) {
  const data = read();
  let updated = null;
  data[collection] = (data[collection] || []).map((item) => {
    if (predicate(item)) {
      updated = { ...item, ...updates };
      return updated;
    }
    return item;
  });
  await write(data);
  return updated;
}

async function remove(collection, predicate) {
  const data = read();
  const initialLength = (data[collection] || []).length;
  data[collection] = (data[collection] || []).filter((item) => !predicate(item));
  const removed = initialLength > data[collection].length;
  if (removed) await write(data);
  return removed;
}

module.exports = { all, findOne, findMany, insert, update, remove };
