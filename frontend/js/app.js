import { login, protectAdminPage } from "./login.js";

const currentPage = window.location.pathname.split("/").pop() || "";


if (currentPage === "admin.html") {

    protectAdminPage();

} else {

    login();

}