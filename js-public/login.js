/**
 * Módulo de Autenticação e Segurança
 * Compatível com ES Modules e navegadores modernos.
 */

const API_LOGIN_URL = "https://apiadministrativa.onrender.com/api/login";

// Flag interna para evitar múltiplos addEventListener (Memory Leak protection)
let isLoginInitialized = false;

/**
 * Utilitário seguro para manipular o localStorage com tratamento resiliente de exceções.
 */
const safeStorage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            return JSON.parse(item);
        } catch (error) {
            console.warn(`[Storage] Erro ao desmaterializar a chave "${key}". Limpando registro...`, error);
            localStorage.removeItem(key);
            return null;
        }
    },
    set: (key, value) => {
        try {
            const dataToStore = typeof value === "string" ? value : JSON.stringify(value);
            localStorage.setItem(key, dataToStore);
            return true;
        } catch (error) {
            console.error(`[Storage] Erro ao gravar a chave "${key}":`, error);
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`[Storage] Erro ao remover a chave "${key}":`, error);
        }
    }
};

/**
 * Redireciona com segurança mantendo caminhos relativos corretos.
 */
function redirectTo(pageName) {
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
    window.location.href = `${window.location.origin}${basePath}${pageName}`;
}

/**
 * Formata o CPF para a máscara 000.000.000-00.
 */
function formatCpf(value) {
    if (!value) return "";
    const cpf = value.replace(/\D/g, "").slice(0, 11);

    if (cpf.length <= 3) return cpf;
    if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;

    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

/**
 * Controla a visibilidade dos alertas visuais do sistema.
 */
function showAlert(alertElement) {
    const container = document.querySelector(".alerts");
    const alerts = [
        document.getElementById("erroservidor"),
        document.getElementById("errologin"),
        document.getElementById("corretologin")
    ];

    alerts.forEach(alert => {
        if (alert) alert.style.display = "none";
    });

    if (container) {
        container.style.display = alertElement ? "flex" : "none";
    }

    if (alertElement) {
        alertElement.style.display = "block";
    }
}

/**
 * Atualiza o estado da interface durante o envio do formulário.
 */
function toggleLoading(loading) {
    const button = document.getElementById("btn_enter");
    if (!button) return;

    button.disabled = loading;
    const label = button.querySelector(".btn-label");

    if (label) {
        label.textContent = loading ? "Entrando..." : "Entrar";
    } else {
        button.textContent = loading ? "Entrando..." : "Entrar";
    }
}

/**
 * Lê o corpo da resposta HTTP de forma ultra-segura contra JSONs corrompidos,
 * truncados ou HTMLs de erro do servidor.
 */
async function parseResponseBody(response) {
    // 204 No Content
    if (response.status === 204) {
        return null;
    }

    let rawText = "";
    try {
        rawText = await response.text();
    } catch (readError) {
        console.error("[API] Falha ao ler o fluxo de texto da resposta:", readError);
        return null;
    }

    if (!rawText || !rawText.trim()) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJsonHeader = contentType.includes("application/json");

    // Tentativa defensiva de conversão para objeto
    try {
        return JSON.parse(rawText);
    } catch (jsonError) {
        console.error("[API] Erro de sintaxe ao converter resposta para JSON.");
        console.warn("[API Diagnostic] É um cabeçalho JSON?", isJsonHeader);
        console.warn("[API Diagnostic] Amostra inicial dos dados recebidos:", rawText.slice(0, 200));
        return null;
    }
}

/**
 * Processa a submissão do formulário de Login.
 */
async function handleLoginSubmit(e) {
    e.preventDefault();

    const inputCpf = document.getElementById("cpf");
    const inputSenha = document.getElementById("password");
    const erroLogin = document.getElementById("errologin");
    const erroServidor = document.getElementById("erroservidor");
    const sucesso = document.getElementById("corretologin");

    if (!inputCpf || !inputSenha) return;

    const cpf = inputCpf.value.replace(/\D/g, "");
    const senha = inputSenha.value.trim();

    if (cpf.length !== 11 || senha === "") {
        showAlert(erroLogin);
        return;
    }

    toggleLoading(true);
    showAlert(null);

    try {
        const load_animation = document.getElementById("load_animation")
        load_animation.style.display = "flex";
        const response = await fetch(API_LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ cpf, senha })
        });

        // Trata erros HTTP (401, 403, 404, 500, etc.)
        if (!response.ok) {
            if (response.status >= 500) {
                showAlert(erroServidor);
            } else {
                showAlert(erroLogin);
            }
            return;
        }

        const data = await parseResponseBody(response);

        // Se a resposta for inválida ou não puder ser convertida
        if (!data || typeof data !== "object") {
            console.error("[Login] O servidor respondeu com sucesso HTTP, mas os dados retornados são inválidos.");
            showAlert(erroServidor);
            return;
        }

        // Armazenamento seguro
        safeStorage.set("usuario", data);

        if (data.token) {
            safeStorage.set("token", data.token);
        }

        showAlert(sucesso);

        const tipo = (
            data.tipo ||
            data.role ||
            data.usuario?.tipo ||
            ""
        ).toUpperCase();

        setTimeout(() => {
            redirectTo(
                tipo === "ADMIN"
                    ? "admin.html"
                    : "paginainicial.html"
            );
        }, 800);

    } catch (error) {
        console.error("[Login Error]: Exceção na requisição:", error);
        showAlert(erroServidor);
    } finally {
        toggleLoading(false);
    }
}

/**
 * Inicializa a escuta de eventos com proteção contra múltiplos registros.
 */
function login() {
    const form = document.querySelector(".form");
    const inputCpf = document.getElementById("cpf");
    const inputSenha = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");

    if (!form || !inputCpf || !inputSenha) return;

    if (!isLoginInitialized) {
        inputCpf.addEventListener("input", e => {
            e.target.value = formatCpf(e.target.value);
        });

        if (togglePassword) {
            togglePassword.addEventListener("click", () => {
                const visible = inputSenha.type === "password";

                inputSenha.type = visible ? "text" : "password";
                togglePassword.setAttribute("aria-pressed", visible);

                const eye = togglePassword.querySelector(".icon-eye");
                const eyeOff = togglePassword.querySelector(".icon-eye-off");

                if (eye && eyeOff) {
                    eye.hidden = visible;
                    eyeOff.hidden = !visible;
                }
            });
        }

        form.addEventListener("submit", handleLoginSubmit);
        isLoginInitialized = true;
    }
}

/**
 * Protege rotas restritas a administradores.
 */
function protectAdminPage() {
    const usuario = safeStorage.get("usuario");

    if (!usuario) {
        safeStorage.remove("usuario");
        safeStorage.remove("token");
        redirectTo("index.html");
        return;
    }

    const tipo = (
        usuario.tipo ||
        usuario.role ||
        usuario.usuario?.tipo ||
        ""
    ).toUpperCase();

    if (tipo !== "ADMIN") {
        redirectTo("index.html");
    }
}

// Inicialização automática após carregamento do DOM
if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        if (document.querySelector(".form")) {
            login();
        }
    });
}

export { login, protectAdminPage };