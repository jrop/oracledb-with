import co from 'co'
import oracle from 'oracledb'

/**
 * @param {object} opts The options passed directly to `oracledb.getConnection(...)`
 * @param {function} fn The async function to run with the acquired connection
 * @example
 * import witho from 'oracle-with'
 * await witho.conn({connectString: '...', ...}, async conn => {
 *   await conn.execute(...)
 * })
 */
async function conn(opts, fn) {
	let conn
	try {
		conn = await oracle.getConnection(opts)
		conn.resultSet = (sql, bind, opts, fn) => resultSet(conn, sql, bind, opts, fn)
		conn.select = (sql, bind, opts, fn) => select(conn, sql, bind, opts, fn)
		return await co.wrap(fn)(conn)
	} finally {
		if (conn)
			await conn.close()
	}
}

/**
 * @param {Connection} conn The Oracle connection
 * @param {string} sql The SQL to run
 * @param {array|object} bind The bind parameters
 * @param {object} opts The options passed directly to `oracleConn.execute(...)`
 * @param {function} fn The async function `(resultSet, results) => {...}` to run
 * @example
 * import witho from 'oracle-with'
 * witho.resultSet(conn, 'SELECT * FROM ...', [], {outFormat: oracledb.OBJECT}, async (resultSet, results) => {
 *   await resultSet.getRow()
 *   // use: results.metaData
 * })
 * // or use on an existing connection:
 * await witho.conn({connectString: '...', ...}, async conn => {
 *   await conn.resultSet(sql, bind, opts, async resultSet => {
 *     // ...
 *   })
 * })
 */
async function resultSet(conn, sql, bind, opts, fn) {
	opts = Object.assign(opts, {resultSet: true})
	let results
	try {
		results = await conn.execute(sql, bind, opts)
		return await co.wrap(fn)(results.resultSet, results)
	} finally {
		if (results)
			await results.resultSet.close()
	}
}

/**
 * @param {Connection} conn The Oracle connection
 * @param {string} sql The SQL to run
 * @param {array|object} bind The bind parameters
 * @param {object} opts The options passed directly to `oracleConn.execute(...)`
 * @return {Results} Returns the results returned from `oracledb.execute(...)`, with `.rows` pre-populated from the complete resultSet
 * @example
 * witho.select(conn, 'SELECT * FROM ...')
 * // => Promise<OracleResult {
 * //      ...
 * //      metaData: ...,
 * //      rows: [...],
 * //      ...
 * //    }>
 */
async function select(conn, sql, bind, opts) {
	bind = bind || []
	opts = opts || {outFormat: oracle.OBJECT}
	const results = await conn.resultSet(sql, bind, opts, async (resultSet, results) => {
		results.rows = []
		let row
		while ((row = await resultSet.getRow()))
			results.rows.push(row)
		return results
	})
	delete results.resultSet
	return results
}

export {conn, resultSet, select}
