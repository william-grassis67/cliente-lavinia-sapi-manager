package com.example.demo.service;

import com.example.demo.dto.LoginDTO;
import com.example.demo.entity.Usuario;
import com.example.demo.exception.CampoInvalidoexception;
import com.example.demo.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;

@Service
public class LoginService {

    private final ClienteRepository clienteRepository;
    private final JwtService jwtService;

    public LoginService(ClienteRepository clienteRepository, JwtService jwtService) {
        this.clienteRepository = clienteRepository;
        this.jwtService = jwtService;
    }

    Date date = new Date();

    public LoginDTO login(String cpf, String senha) {

        System.out.println("CPF recebido: [" + cpf + "]");
        System.out.println("Senha recebida: [" + senha + "]");


        Usuario usuario = clienteRepository.findByCpf(cpf)
                .orElseThrow(() ->
                        new CampoInvalidoexception(
                                "CPF ou senha inválidos!"
                        )
                );


        System.out.println("Usuário encontrado: " + usuario.getNome());
        System.out.println("Senha no banco: [" + usuario.getSenha() + "]");


        if (usuario.getSenha() == null ||
                !usuario.getSenha().equals(senha)) {

            throw new CampoInvalidoexception(
                    "CPF ou senha inválidos!"
            );
        }

        String token = jwtService.gerarToken(usuario);

        usuario.setUltimoAcesso(LocalDateTime.now());

        return new LoginDTO(
                usuario.getCpf(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTipo(),
                usuario.getUltimoAcesso(),
                token
        );
    }
}

