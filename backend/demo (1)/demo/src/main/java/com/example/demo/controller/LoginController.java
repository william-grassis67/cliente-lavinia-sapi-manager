package com.example.demo.controller;

import com.example.demo.dto.LoginDTO;
import com.example.demo.service.LoginService;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RequestMapping("/api")
@RestController
public class LoginController {

    private final LoginService loginService;


    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }


    @PostMapping("/login")
    public LoginDTO login(@RequestBody LoginDTO dados) {

        return loginService.login(
                dados.getCpf(),
                dados.getSenha()
        );
    }
}