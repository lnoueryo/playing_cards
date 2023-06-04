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
  }
}

const sessionRequiredRouteHandlers = {
  'GET': {
    '/': homeController.index.bind(homeController),
    '/table/:id': tableController.index.bind(tableController),
    '/api/table': homeController.tables.bind(homeController),
    '/api/table/:id': tableController.show.bind(tableController),
    '/api/user': loginController.user.bind(loginController),
  },
  'POST': {
    '/api/logout': loginController.logout.bind(loginController),
    '/api/table/create': tableController.create.bind(tableController),
    '/api/table/:id/join': tableController.joinPlayer.bind(tableController),
    '/api/table/:id/reset': tableController.reset.bind(tableController),
    '/api/table/:id/next': tableController.next.bind(tableController),
    '/api/table/:id/exit': tableController.exit.bind(tableController),
  }
};

export { routeHandlers, sessionRequiredRouteHandlers }