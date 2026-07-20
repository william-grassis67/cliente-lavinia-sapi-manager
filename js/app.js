import { verificarLogin } from "./auth.js";
import { login, protectAdminPage } from "./login.js";

// Obtém o nome do arquivo atual de forma limpa, ignorando query strings ou hashes
const currentPath = window.location.pathname;
const currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1);

// Se estiver na raiz "/" ou explicitamente no index.html (Tela de Login)
if (currentPage === "index.html" || currentPage === "") {
    // 1. Verifica se o usuário já possui sessão ativa para evitar login duplicado
    if (typeof verificarLogin === "function") {
        verificarLogin();
    }
    // 2. Inicializa os seletores e eventos do formulário de login
    login();
}

// Se estiver na página de administração
if (currentPage === "admin.html") {
    // Protege a página contra acessos não autorizados
    protectAdminPage();
}