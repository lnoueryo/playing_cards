import { Knex } from 'knex';
import { test } from '../../../../knexfile';
import { DatabaseSessionManager } from '../../../../modules/auth/session_manager/database_session_manager';
import { setupTestDB, teardownTestDB } from '../../../../__test_modules__/setup_test_db';
import { Mysql } from '../../../../modules/middleware/mysql';
import {  Session } from '../../../../modules/auth/auth_token/session';
import { CookieManager } from '../../../../modules/auth/cookie_manager';
const bcrypt = require('bcryptjs');
import http from 'http';
import { Player, PlayerAggregate } from '../../../../models/player';
import { CardAggregate } from '../../../../models/card';
import { Table } from '../../../../models/table';
require('dotenv').config();

describe('Test suite', function () {
    let mockRequest: jest.Mocked<http.IncomingMessage>;
    // let mockResponse: jest.Mocked<http.ServerResponse>;
    let db: Knex;
    const tokenUser = {
        id: 1,
        user_id: 1,
        table_id: '',
        name: 'Test User',
        password: 'test_password',
        email: 'test@example.com',
        image: 'test_image'
    };
    mockRequest = {
        headers: {
            cookie: ''
        }
    } as any;
    const headers: {[key: string]: string} = {};
    const mockResponse = {
        // 既存のプロパティとメソッドをここに追加します
        setHeader: (name: string, value: string) => {
            headers[name] = value;
        },
        getHeader: (name: string) => {
            return headers[name];
        }
    } as jest.Mocked<http.ServerResponse>

    const { host, user, password, database } = test.connection
    const mysql = new Mysql(host, user, password, database)
    // beforeEach(() => {
    // });

    // テスト前に実行
    beforeAll(async function () {
        db = await setupTestDB()
    });

    // テスト後に実行
    afterAll(async function () {
        await teardownTestDB(db)
    });

    describe('createSessionId', function() {
        it('should pass the test', function () {
            const { host, user, password, database } = test.connection
            const mysql = new Mysql(host, user, password, database)
            const cm = new CookieManager(mockRequest, mockResponse, 'sessionid')
            const dsm = new DatabaseSessionManager(mysql)
            const session = Session.createSessionId(user, cm, dsm)
            expect(session.cm).toEqual(cm);
            expect(session.user).toEqual(user);
            expect(session.manager).toEqual(dsm);
        });
    })

    describe('createSessionId && saveToStorage && getUser && deleteSession && createAuthToken && createTable && deleteTable', function() {
        it('should pass the test', async function () {
            const hashedPassword = await bcrypt.hash(password, 10);
            const queryString = 'INSERT INTO users (name, password, email, image) VALUES (?, ?, ?, ?)'
            const [result] = await mysql.pool.query(queryString, [tokenUser.name, hashedPassword, tokenUser.email, tokenUser.image]) as any
            const id = result.insertId;
            tokenUser.user_id = id
            const cm = new CookieManager(mockRequest, mockResponse, 'sessionid')
            const dsm = new DatabaseSessionManager(mysql)
            const session = Session.createSessionId(tokenUser, cm, dsm)
            await session.saveToStorage()
            const userWithSession = await Session.getUser(session.id, session.manager)
            expect(!!userWithSession).toBeTruthy();

            const _session = await Session.createAuthToken(session.id, cm, dsm);
            if(!_session) throw('no session')
            const tableId = 'test_table_id'
            const newSession = await _session.createTable(tableId)
            const user = await Session.getUser(newSession.id, dsm)
            expect(user.table_id).toEqual(tableId);

            await newSession.deleteTable()
            const _user = await Session.getUser(newSession.id, dsm)
            expect(_user.table_id).toEqual('');

            await newSession.deleteSession()
            const userWithoutSession = await Session.getUser(newSession.id, newSession.manager)
            expect(userWithoutSession).toBeNull();

            await mysql.pool.query('DELETE FROM users WHERE id = ?', [id]) as any

        });
    })


});
