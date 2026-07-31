//import { login, protectAdminPage } from "./login.js";
import { login, protectAdminPage } from "./login";
const currentPage = window.location.pathname.split("/").pop() || "";


if (currentPage === "admin.html") {

    protectAdminPage();

} else {

    login();

}