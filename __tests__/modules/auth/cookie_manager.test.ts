import http from 'http';
import { CookieManager } from '../../../modules/auth/cookie_manager';


describe('CookieManager', () => {
    let mockRequest: jest.Mocked<http.IncomingMessage>;
    let mockResponse: jest.Mocked<http.ServerResponse>;

    beforeEach(() => {
        mockRequest = {
            headers: {
                cookie: 'session=existing_cookie_value'
            }
        } as any;
        mockResponse = {
            setHeader: jest.fn(),
        } as any;
    });

    test('should set value to cookie', () => {
        const cm = new CookieManager(mockRequest, mockResponse, 'session');

        cm.setValueToCookie('new_cookie_value');

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Set-Cookie',
            expect.stringContaining('session=new_cookie_value')
        );
    });

    test('should get cookie value', () => {
        const cm = new CookieManager(mockRequest, mockResponse, 'session');

        const cookieValue = cm.getCookieValue();

        expect(cookieValue).toBe('existing_cookie_value');
    });

    test('should return null when cookie does not exist', () => {
        const cm = new CookieManager(
            { headers: { cookie: '' } } as any,
            mockResponse,
            'session'
        );

        const cookieValue = cm.getCookieValue();

        expect(cookieValue).toBe('');
    });

    test('should expire cookie', () => {
        const cm = new CookieManager(mockRequest, mockResponse, 'session');

        cm.expireCookie();

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Set-Cookie', 
            expect.stringContaining('session=deleted')
        );
    });
});
