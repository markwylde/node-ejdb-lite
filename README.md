# EJDB2 Node.js native binding

Embeddable JSON Database engine http://ejdb.org Node.js binding.

See https://github.com/Softmotions/ejdb/blob/master/README.md

This project automatically builds the c to node bindings in [GitHub actions](https://github.com/markwylde/node-ejdb-lite/actions), then stores them in the [Github releases](https://github.com/markwylde/node-ejdb-lite/releases).

This means you can install ejdb on an Linux, Alpine or macOS machine, without the need for c, gcc, make or any other build tools.

For full information on ejdb2, please visit the [offical project repository](https://github.com/Softmotions/ejdb).

## Differences from offical library
The official EJDB2 library for nodejs is fantastic, but this library has a few differences:
- No build from source required (binaries precompiled and stored in github releases)
- Therefore, no cmake, make or g++ required to install
- Fallback to build from source when no compatable prebuilt binary found 
- Removed all typescript and yarn usages
- Fixes a [bug](https://github.com/Softmotions/ejdb/issues/298) with unicodes characters in JSON

## Example usage
```javascript
const { EJDB2 } = require('node-ejdb-lite');

async function run() {
  const db = await EJDB2.open("example.db", { truncate: true });

  var id = await db.put("parrots", { name: "Bianca", age: 4 });
  console.log(`Bianca record: ${id}`);

  id = await db.put("parrots", { name: "Darko", age: 8 });
  console.log(`Darko record: ${id}`);

  const q = db.createQuery("/[age > :age]", "parrots");

  for await (const doc of q.setNumber("age", 3).stream()) {
    console.log(`Found ${doc}`);
  }

  await db.close();
}

run();
```

## Supported platforms

- Linux x64
- OSX

## Prerequisites

- node >= v10.0.0
- yarn
- CMake >= v3.10
- Make
- gcc or clang compiler

## How build it manually

```sh
git clone https://github.com/Softmotions/ejdb.git
cd ./ejdb
mkdir ./build && cd build
cmake .. -DBUILD_NODEJS_BINDING=ON -DCMAKE_BUILD_TYPE=Release
make
cd src/bindings/ejdb2_node/ejdb2_node
yarn pack
```
