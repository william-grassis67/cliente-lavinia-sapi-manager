import { verificarLogin } from "./auth.js";
import { login, protectAdminPage } from "./login.js";


const currentPage = window.location.pathname.split("/").pop() || "index.html";


if (currentPage === "index.html" || currentPage === "") {

    verificarLogin();
    login();

}


if (currentPage === "admin.html") {

    protectAdminPage();

}