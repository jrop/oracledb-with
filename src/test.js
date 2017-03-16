/* eslint-disable no-console */
import assert from 'assert'
import fs from 'mz/fs'
import inquirer from 'inquirer'
import tnsParser from 'tns'
import * as witho from './index'

async function main() {
	assert(process.env.TNS_DIR, 'You must define the environment variable TNS_DIR')
	assert(process.env.DB, 'You must define the environment variable DB')
	assert(process.env.DB_USER, 'You must define the environment variable DB_USER')

	const tns = tnsParser(await fs.readFile(`${process.env.TNS_DIR}/tnsnames.ora`, 'utf-8'))
	const dbConfig = tns[process.env.DB]
	assert(dbConfig, `${process.env.DB} not defined in TNS config`)

	const connectString = dbConfig.toString()
	const {password} = await inquirer.prompt([{type: 'password', message: 'Password:', name: 'password'}])
	const DB_CONFIG = {
		connectString,
		user: process.env.DB_USER,
		password,
	}

	await witho.conn(DB_CONFIG, async conn => {
		const {rows, metaData} = await conn.select('SELECT 1 FROM DUAL')
		assert.deepEqual(rows, [{'1': 1}])
		assert.deepEqual(metaData, [{name: '1'}])
	})

	console.log('All tests completed successfully')
}
main().catch(e => {
	console.error(e.stack)
	process.exitCode = 1
})
