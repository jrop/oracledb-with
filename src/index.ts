import * as co from 'co'
import * as oracle from 'oracledb'

export declare interface IConnection extends oracle.IConnection {
	resultSet(sql: string,
	          bind: any[]|any,
	          opts: oracle.IExecuteOptions,
	          fn: (resultSet: oracle.IResultSet, results: oracle.IExecuteReturn) => any): Promise<any>
	select(sql: string,
	       bind?: any[]|any,
	       opts?: oracle.IExecuteOptions): Promise<oracle.IExecuteReturn>
}

/**
 * @param {object} opts The options passed directly to `oracledb.getConnection(...)`
 * @param {function} fn The async function to run with the acquired connection
 * @example
 * import witho from 'oracle-with'
 * await witho.conn({connectString: '...', ...}, async conn => {
 *   await conn.execute(...)
 * })
 */
export async function connection(opts, fn: (conn: IConnection) => any): Promise<any> {
	let conn: IConnection
	try {
		conn = await oracle.getConnection(opts as oracle.IConnectionAttributes) as IConnection
		conn.resultSet = (sql: string, bind: any[]|any, opts: oracle.IExecuteOptions, fn: () => any) =>
			resultSet(conn, sql, bind, opts, fn)
		conn.select = (sql: string, bind: any[]|any, opts: oracle.IExecuteOptions) =>
			select(conn, sql, bind, opts)
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
export async function resultSet(conn: IConnection,
                                sql: string,
                                bind: any[]|any,
                                opts: oracle.IExecuteOptions,
                                fn: (resultSet: oracle.IResultSet, results: oracle.IExecuteReturn) => any): Promise<any> {
	opts = Object.assign(opts, {resultSet: true})
	let results: oracle.IExecuteReturn
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
export async function select(conn: IConnection,
                             sql: string, bind: any[]|any = [],
                             opts: any = {outFormat: oracle.OBJECT}): Promise<oracle.IExecuteReturn> {
	const results: oracle.IExecuteReturn = await conn.resultSet(sql, bind, opts, async (resultSet, results) => {
		const rows = []
		let row
		while ((row = await resultSet.getRow()))
			rows.push(row as any)
		results.rows = rows
		return results
	})
	delete results.resultSet
	return results
}
