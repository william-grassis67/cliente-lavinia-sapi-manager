package com.example.demo.controller;

import com.example.demo.dto.UsuarioDTO;
import com.example.demo.entity.Usuario;
import com.example.demo.service.AdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;


    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }


    // CADASTRAR CLIENTE
    @PostMapping("/register")
    public UsuarioDTO registerUser(@RequestBody UsuarioDTO usuarioDTO) {

        return adminService.registerUser(
                usuarioDTO.getNome(),
                usuarioDTO.getEmail(),
                usuarioDTO.getEndereco(),
                usuarioDTO.getCpf(),
                usuarioDTO.getSenha()
        );
    }


    // REMOVER CLIENTE
    @DeleteMapping("/remove/{cpf}")
    public void removeUser(@PathVariable String cpf) {

        adminService.removeUser(cpf);
    }


    // LISTAR TODOS OS USUÁRIOS
    @GetMapping("/users")
    public List<Usuario> listUsers() {

        return adminService.listUsers();
    }


    // LISTAR APENAS CLIENTES
    @GetMapping("/clientes")
    public List<Usuario> listClientes() {

        return adminService.listClientes();
    }
}