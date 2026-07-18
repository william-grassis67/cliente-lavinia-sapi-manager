package com.example.demo.repository;

import com.example.demo.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByCpf(String cpf);

    List<Usuario> findByTipo(Usuario.TipoUsuario tipo);

    Optional<Usuario> findByEmail(String email);
}