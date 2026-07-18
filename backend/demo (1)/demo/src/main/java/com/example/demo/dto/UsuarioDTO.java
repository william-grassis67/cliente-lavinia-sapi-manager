package com.example.demo.dto;

import com.example.demo.entity.Usuario;

public class UsuarioDTO {

    private Integer id;
    private String nome;
    private String email;
    private String endereco;
    private String cpf;
    private String senha;
    private Usuario.TipoUsuario tipo;


    public UsuarioDTO() {
    }


    public UsuarioDTO(
            Integer id,
            String nome,
            String email,
            String endereco,
            String cpf
    ) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.endereco = endereco;
        this.cpf = cpf;
    }


    public UsuarioDTO(
            Integer id,
            String nome,
            String email,
            String endereco,
            String cpf,
            Usuario.TipoUsuario tipo
    ) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.endereco = endereco;
        this.cpf = cpf;
        this.tipo = tipo;
    }


    public Integer getId() {
        return id;
    }


    public void setId(Integer id) {
        this.id = id;
    }


    public String getNome() {
        return nome;
    }


    public void setNome(String nome) {
        this.nome = nome;
    }


    public String getEmail() {
        return email;
    }


    public void setEmail(String email) {
        this.email = email;
    }


    public String getEndereco() {
        return endereco;
    }


    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }


    public String getCpf() {
        return cpf;
    }


    public void setCpf(String cpf) {
        this.cpf = cpf;
    }


    public Usuario.TipoUsuario getTipo() {
        return tipo;
    }


    public void setTipo(Usuario.TipoUsuario tipo) {
        this.tipo = tipo;
    }

    public String getSenha() {
        return senha;
    }


    public void setSenha(String senha) {
        this.senha = senha;
    }
}