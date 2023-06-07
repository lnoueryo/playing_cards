import { HomeController, LoginController, TableController } from "../controllers";

const tableController = new TableController()
const homeController = new HomeController()
const loginController = new LoginController()

const routeHandlers = {
  'GET': {
    '/login': loginController.index.bind(loginController),
  },
  'POST': {
    '/api/login': loginController.login.bind(loginController),
    '/api/user/create': loginController.create.bind(loginController),
  }
}

const sessionRequiredRouteHandlers = {
  'GET': {
    '/': homeController.index.bind(homeController),
    '/api/table': homeController.tables.bind(homeController),
    '/api/session': loginController.session.bind(loginController),
  },
  'POST': {
    '/api/logout': loginController.logout.bind(loginController),
    '/api/table/create': homeController.create.bind(tableController),
    '/api/table/join': homeController.joinPlayer.bind(tableController),
  }
};

const tokenRequiredRouteHandlers = {
  'GET': {
    '/table/:id': tableController.index.bind(tableController),
    '/api/token': loginController.token.bind(loginController),
    '/api/table/:id': tableController.show.bind(tableController),
  },
  'POST': {
    '/api/table/:id/next': tableController.next.bind(tableController),
    '/api/table/:id/exit': tableController.exit.bind(tableController),
  }
}

export { routeHandlers, sessionRequiredRouteHandlers, tokenRequiredRouteHandlers }