// import { JsonWebToken } from './JsonWebToken';
// import { CookieManager } from '../cookie_manager';
import http from 'http';
import jwt from 'jsonwebtoken';
import { CookieManager } from '../../../../modules/auth/cookie_manager';
import { JsonWebToken } from '../../../../modules/auth/auth_token/json_web_token';
import { BaseAuthToken } from '../../../../modules/auth/auth_token/base_auth_token';
require('dotenv').config();

// Mocking jwt and CookieManager
let mockRequest: jest.Mocked<http.IncomingMessage>;
let mockResponse: jest.Mocked<http.ServerResponse>;
const user = {
    id: 'test_id',
    user_id: 1,
    table_id: 'test_table_id',
    name: 'Test User',
    password: 'test_password',
    email: 'test@example.com',
    image: 'test_image'
};
const secretKey = 'b163fe16747b8c8290feff9473e9a818d43013a71aa371642ef2013ef58f5d82'
const id = jwt.sign(user, secretKey, { expiresIn: '1h'})

describe('JsonWebToken', () => {
    beforeEach(() => {
        mockResponse = {
          setHeader: jest.fn(),
          // 他に必要なメソッドがあればここに追加
        } as unknown as jest.Mocked<http.ServerResponse>;
    });

    describe('constructor', () => {
        it('should properly initialize with a user', async() => {

            const cm = new CookieManager(mockRequest, mockResponse, 'token')
            const token = new JsonWebToken(id, cm, user, secretKey)
            expect(token.id).toEqual(id);
            expect(token.cm).toEqual(cm);
            expect(token.user).toEqual(user);
            expect(token.secretKey).toEqual(secretKey);

        });

    });

    describe('saveToStorage', () => {
        it('should set a token to cookie', async() => {

            const cm = new CookieManager(mockRequest, mockResponse, 'token')
            const token = new JsonWebToken(id, cm, user, secretKey)
            token.saveToStorage()

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining(id));

        });

    });

    describe('deleteSession', () => {
        it('should expire cookie token', async() => {

            const cm = new CookieManager(mockRequest, mockResponse, 'token')
            const token = new JsonWebToken(id, cm, user, secretKey)
            await token.saveToStorage()
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining(id));
            await token.deleteSession()
            // First call
            expect(mockResponse.setHeader).toHaveBeenNthCalledWith(1, 'Set-Cookie', expect.stringContaining(id));
            // Second call
            expect(mockResponse.setHeader).toHaveBeenNthCalledWith(2, 'Set-Cookie', `${cm.id}=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

        });

    });

    describe('createTable', () => {
        it('should change token id and add table_id to user in JsonWebToken', async() => {

            const user = {
                id: 'test_id',
                user_id: 1,
                table_id: '',
                name: 'Test User',
                password: 'test_password',
                email: 'test@example.com',
                image: 'test_image'
            };

            const cm = new CookieManager(mockRequest, mockResponse, 'token')
            const id = jwt.sign(user, secretKey, { expiresIn: '1h'})
            const token = new JsonWebToken(id, cm, user, secretKey)
            const table_id = 'sfdagsmo;mlgkuyvhsrgjhkgl'

            expect(token.user.table_id).toEqual('');

            const newToken = await token.createTable(table_id)
            expect(newToken.id).not.toEqual(id);
            expect(newToken.user.table_id).toEqual(table_id);

        });

    });

    describe('createJsonWebToken', () => {
        it('should create JsonWebToken from user', async() => {

            const cm = new CookieManager(mockRequest, mockResponse, 'token')
            const token = await JsonWebToken.createJsonWebToken(user, cm, secretKey)
            expect(token.id).toEqual(id);

        });

    });

    describe('getUser', () => {

        it('should get user from token', async() => {

            const decodedUser = await JsonWebToken.getUser(id, secretKey) || []
            const sessionToken = Object.entries(decodedUser).reduce((acc: {[key: string]: string | number}, [key, value]) => {
                if(key == 'iat' || key == 'exp') return acc
                acc[key] = value;
                return acc;
              }, {});

            expect(sessionToken).toEqual(user);
        });

        it('should return null when JWT verification fails', async() => {

            const id = 'adgfsdbfhklnkcs;l,ls,kc;ae'
            const decodedUser = await JsonWebToken.getUser(id, secretKey)
            expect(decodedUser).toBeNull()
        });

    });

    describe('createAuthToken', () => {
        it('should create JsonWebToken from id', async() => {

            const cm = new CookieManager(mockRequest, mockResponse, 'token')

            const token = await JsonWebToken.createAuthToken(id, cm, secretKey)
            expect(token).toBeTruthy();
            expect(token?.id).toEqual(id);
        });

    });

    describe('BaseAuthToken', () => {
        describe('constructor', () => {
            it('should properly initialize with a user', () => {
                const user = {
                    id: 'test_id',
                    user_id: 1,
                    table_id: 'test_table_id',
                    name: 'Test User',
                    password: 'test_password',
                    email: 'test@example.com',
                    image: 'test_image'
                };

                const token = new BaseAuthToken(user);

                expect(token.user).toEqual(user);
            });

        });

        describe('isYourTable', () => {
            it('should return true if the user is in the specified table', () => {
                const user = {
                    id: 'test_id',
                    user_id: 1,
                    table_id: 'test_table_id',
                    name: 'Test User',
                    password: 'test_password',
                    email: 'test@example.com',
                    image: 'test_image'
                };

                const token = new BaseAuthToken(user);

                expect(token.isYourTable({id: 'test_table_id'})).toBe(true);
            });

            it('should return false if the user is not in the specified table', () => {
                const user = {
                    id: 'test_id',
                    user_id: 1,
                    table_id: 'other_table_id',
                    name: 'Test User',
                    password: 'test_password',
                    email: 'test@example.com',
                    image: 'test_image'
                };

                const token = new BaseAuthToken(user);

                expect(token.isYourTable({id: 'test_table_id'})).toBe(false);
            });
        });

        describe('hasTableId', () => {
            it('should return true if the user.table_id is in the specified table', () => {
                const user = {
                    id: 'test_id',
                    user_id: 1,
                    table_id: 'test_table_id',
                    name: 'Test User',
                    password: 'test_password',
                    email: 'test@example.com',
                    image: 'test_image'
                };

                const token = new BaseAuthToken(user);

                expect(token.hasTableId()).toBe(true);
            });

            it('should return false if the user.table_id is not in the specified table', () => {
                const user = {
                    id: 'test_id',
                    user_id: 1,
                    table_id: '',
                    name: 'Test User',
                    password: 'test_password',
                    email: 'test@example.com',
                    image: 'test_image'
                };

                const token = new BaseAuthToken(user);

                expect(token.hasTableId()).toBe(false);
            });
        });
    });

});
