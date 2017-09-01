# oracledb-with

[![Greenkeeper badge](https://badges.greenkeeper.io/jrop/oracledb-with.svg)](https://greenkeeper.io/)

A simple resource management utility for working with [node-oracledb](https://github.com/oracle/node-oracledb).

## Installation

```sh
npm install --save oracledb-with
# or
yarn add oracledb-with
```

## Usage

Hint: [view the API documentation](https://jrop.github.io/oracledb-with).


```js
import witho from 'oracle-with'

//
// Connections will automatically be cleaned up (closed) for you
//
await witho.conn({connectString: '...', ...}, async conn => {
  await conn.execute(...)
})

//
// ResultSets are automatically cleaned up as well:
//
witho.resultSet(conn, 'SELECT * FROM ...', [], {outFormat: oracledb.OBJECT}, async (resultSet, results) => {
  await resultSet.getRow()
  // use: results.metaData
})

//
// ...or if you already have a connection created with oracledb-with:
//
await witho.conn({connectString: '...', ...}, async conn => {
  await conn.resultSet(sql, bind, opts, async resultSet => {
    // ...
  })
})

//
// Easy selects:
//
witho.select(conn, 'SELECT * FROM ...')
// => Promise<OracleResult {
//      ...
//      metaData: ...,
//      rows: [...],
//      ...
//    }>

//
// Or:
//
await witho.conn({connectString: '...', ...}, async conn => {
  await conn.select(sql, bind, opts, async results => {
    // ...
  })
})
```
