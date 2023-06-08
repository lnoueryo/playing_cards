import { BaseAuthToken } from "../../../../modules/auth/auth_token/base_auth_token";


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
