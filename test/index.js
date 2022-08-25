/**************************************************************************************************
 * EJDB2 Node.js native API binding.
 *
 * MIT License
 *
 * Copyright (c) 2012-2022 Softmotions Ltd <info@softmotions.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *************************************************************************************************/

const assert = require('assert');
const test = require('basictap');
const { EJDB2, JBE } = require('../src/index');

test('createQuery', async t => {
  const db = await EJDB2.open('hello.db', { truncate: true });

  const query = db.createQuery('@mycoll/*');
  t.ok(query != null, 'query should be null');
  t.equal(query.collection, 'mycoll', 'collection should be correct');
  t.ok(query.db != null, 'db should be null');

  await db.close();
});

test('put works successfully', async t => {
  const db = await EJDB2.open('hello.db', { truncate: true });

  const id = await db.put('mycoll', { foo: 'bar' });

  t.equal(id, 1, 'should return the correct id');

  await db.close();
});

test('put fails when given partial json', async (t) => {
  const db = await EJDB2.open('hello.db', { truncate: true });

  try {
    await db.put('mycoll', '{"');
  } catch (error) {
    t.equal(error.code, '@ejdb IWRC:76005 put', 'error code should be correct');
    t.equal(error.message, 'Unquoted JSON string (JBL_ERROR_PARSE_UNQUOTED_STRING)', 'error message should be correct');
  }

  await db.close();
});

test('get fails from none existing collection', async t => {
  const db = await EJDB2.open('hello.db', { truncate: true });

  try {
    await db.get('mycoll', 1);
  } catch (error) {
    t.equal(error.message, 'Resource is not exists. (IW_ERROR_NOT_EXISTS)', 'should have correct error message');
    t.equal(error.code, '@ejdb IWRC:70004 get', 'should have correct error code');
  }

  await db.close();
});

test('queries', async (t) => {
  const db = await EJDB2.open('hello.db', { truncate: true });
  let q = db.createQuery('@mycoll/*');
  let id = await db.put('mycoll', { foo: 'bar' });
  let doc = await db.get('mycoll', 1);

  await db.put('mycoll', { foo: 'baz' });

  const list = await db.createQuery('@mycoll/*').list({ limit: 1 });
  t.equal(list.length, 1);

  let first = await db.createQuery('@mycoll/*').first();
  t.ok(first != null);
  t.deepEqual(first.json, { foo: 'baz' });
  t.equal(first._raw, null);

  first = await db.createQuery('@mycoll/[zzz=bbb]').first();
  t.equal(first, undefined);

  let firstN = await db.createQuery('@mycoll/*').firstN(5);
  t.ok(firstN != null && firstN.length == 2);
  t.deepEqual(firstN[0].json, { foo: 'baz' });
  t.deepEqual(firstN[1].json, { foo: 'bar' });

  firstN = await db.createQuery('@mycoll/*').firstN(1);
  t.ok(firstN != null && firstN.length == 1);
  t.deepEqual(firstN[0].json, { foo: 'baz' });

  // Query 1
  const rbuf = [];
  for await (const doc of q.stream()) {
    rbuf.push(doc.id);
    rbuf.push(doc._raw);
  }
  t.equal(rbuf.toString(), '2,{"foo":"baz"},1,{"foo":"bar"}');

  // Query 2
  rbuf.length = 0;
  for await (const doc of db.createQuery('@mycoll/[foo=zaz]').stream()) {
    rbuf.push(doc.id);
    rbuf.push(doc._raw);
  }
  t.equal(rbuf.length, 0);

  // Query 3
  for await (const doc of db.createQuery('/[foo=bar]', 'mycoll').stream()) {
    rbuf.push(doc.id);
    rbuf.push(doc._raw);
  }
  t.equal(rbuf.toString(), '1,{"foo":"bar"}');

  let error = null;
  try {
    await db.createQuery('@mycoll/[').stream();
  } catch (e) {
    error = e;
    t.ok(JBE.isInvalidQuery(e));
  }
  t.ok(error != null);
  error = null;

  let count = await db.createQuery('@mycoll/* | count').scalarInt();
  t.equal(count, 2);

  // Del
  await db.del('mycoll', 1);

  error = null;
  try {
    await db.get('mycoll', 1);
  } catch (e) {
    error = e;
    t.ok(JBE.isNotFound(e));
  }
  t.ok(error != null);
  error = null;

  count = await db.createQuery('@mycoll/* | count').scalarInt();
  t.equal(count, 1);

  // Patch
  await db.patch('mycoll', '[{"op":"add", "path":"/baz", "value":"qux"}]', 2);
  doc = await db.get('mycoll', 2);
  t.deepEqual(doc, { foo: 'baz', baz: 'qux' });

  // DB Info
  doc = await db.info();
  t.deepEqual(doc.collections[0], {
    name: 'mycoll',
    rnum: 1,
    dbid: 3,
    indexes: []
  });

  // Indexes
  await db.ensureStringIndex('mycoll', '/foo', true);
  doc = await db.info();

  t.deepEqual(doc.collections[0].indexes[0], {
    ptr: '/foo',
    mode: 5,
    idbf: 0,
    dbid: 4,
    rnum: 1
  });

  // Test JQL set
  doc = await db.createQuery('@mycoll/[foo=:?]').setString(0, 'baz').first();
  t.deepEqual(doc.json, {
    foo: 'baz',
    baz: 'qux'
  });

  let log = null;
  // Test explain log
  await db.createQuery('@mycoll/[foo=:?]').setString(0, 'baz').completionPromise({
    explainCallback: (l) => {
      log = l;
    }
  });
  t.ok(typeof log === 'string');
  t.ok(log.indexOf('[INDEX] MATCHED  UNIQUE|STR|1 /foo EXPR1: \'foo = :?\' INIT: IWKV_CURSOR_EQ') != -1);

  doc = await db.createQuery('@mycoll/[foo=:?] and /[baz=:?]')
    .setString(0, 'baz')
    .setString(1, 'qux')
    .first();
  t.deepEqual(doc.json, {
    foo: 'baz',
    baz: 'qux'
  });

  doc = await db.createQuery('@mycoll/[foo=:foo] and /[baz=:baz]')
    .setString('foo', 'baz')
    .setString('baz', 'qux')
    .first();
  t.deepEqual(doc.json, {
    foo: 'baz',
    baz: 'qux'
  });

  doc = await db.createQuery('@mycoll/[foo re :?]').setRegexp(0, '.*').first();
  t.deepEqual(doc.json, {
    foo: 'baz',
    baz: 'qux'
  });

  doc = await db.createQuery('@mycoll/* | /foo').first();
  t.deepEqual(doc.json, { foo: 'baz' });

  await db.removeStringIndex('mycoll', '/foo', true);
  doc = await db.info();
  t.deepEqual(doc.collections[0], {
    dbid: 3,
    indexes: [],
    name: 'mycoll',
    rnum: 1,
    indexes: []
  });

  await db.removeCollection('mycoll');
  doc = await db.info();
  t.deepEqual(doc.collections, []);

  q = db.createQuery('@c1/* | limit 2');
  t.equal(q.limit, 2);

  q = db.createQuery('@c2/*');
  t.equal(q.limit, 0);

  await db.close();
});

test('unescaped characters', async t => {
  const db = await EJDB2.open('hello.db', { truncate: true });

  const colId = await db.put('mycollchars', { foo: String.fromCharCode(1) });
  const result = await db.get('mycollchars', colId);

  t.deepEqual(result, { foo: String.fromCharCode(1) }, 'should have the correct char code');

  await db.close();
});

test('rename collection', async t => {
  const db = await EJDB2.open('hello.db', { truncate: true });

  const id = await db.put('cc1', { foo: 1 });
  const doc1 = await db.get('cc1', id);
  await db.renameCollection('cc1', 'cc2');
  const doc2 = await db.get('cc2', id);
  t.deepEqual(doc2, doc1, 'should be the same initial document');

  await db.close();
});

test('stress test - series', async t => {
  t.plan(1);

  const db = await EJDB2.open('stress.db', { truncate: true });

  const startTime = Date.now();
  for (let x = 0; x < 10000; x++) {
    const originalDocument = { foo: x };
    const id = await db.put('cc1', originalDocument);
    const returnedDocument = await db.get('cc1', id);
    assert.deepEqual(originalDocument, returnedDocument);
  }

  const timeTaken = Date.now() - startTime;
  t.ok(timeTaken < 5000, `should take less than 5000ms (took ${timeTaken}ms)`);

  await db.close();
});

test('stress test - parallel', async t => {
  t.plan(1);

  const db = await EJDB2.open('stress.db', { truncate: true });

  const startTime = Date.now();
  const promises = [];
  for (let x = 0; x < 10000; x++) {
    const originalDocument = { foo: x };
    promises.push(
      db.put('cc1', originalDocument)
        .then(id => db.get('cc1', id))
        .then(returnedDocument => 
          assert.deepEqual(returnedDocument, originalDocument)
        )
    );
  }

  await Promise.all(promises);

  const timeTaken = Date.now() - startTime;
  t.ok(timeTaken < 5000, `should take less than 5000ms (took ${timeTaken}ms)`);

  await db.close();
});

test('backup and restore', async t => {
  const db1 = await EJDB2.open('hello.db', { truncate: true });
  const id = await db1.put('mycoll', { foo: 'bar' });
  const ts0 = +new Date();
  const ts = await db1.onlineBackup('hello-bkp.db');
  t.ok(ts0 < ts, 'should not have timestamp in the past');
  await db1.close();

  const db2 = await EJDB2.open('hello-bkp.db', { truncate: false });
  const doc = await db2.get('mycoll', id);
  t.deepEqual(doc, { foo: 'bar' }, 'should have initial document');
  await db2.close();
});

