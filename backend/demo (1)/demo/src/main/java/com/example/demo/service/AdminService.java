package com.example.demo.service;

import com.example.demo.dto.UsuarioDTO;
import com.example.demo.entity.Usuario;
import com.example.demo.exception.CampoInvalidoexception;
import com.example.demo.repository.ClienteRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final ClienteRepository clienteRepository;

    public AdminService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }


    // CRIA ADMIN PADRÃO AO INICIAR O SISTEMA
    @PostConstruct
    public void criarAdmin() {

        if (clienteRepository.findByTipo(Usuario.TipoUsuario.ADMIN).isEmpty()) {

            Usuario admin = new Usuario();

            admin.setNome("Administrador");
            admin.setEmail("admin@empresa.com");
            admin.setEndereco("Sistema");
            admin.setCpf("00000000000");

            // Futuramente substituir por BCrypt
            admin.setSenha("123456");

            admin.setTipo(Usuario.TipoUsuario.ADMIN);

            clienteRepository.save(admin);

            System.out.println("Administrador padrão criado!");
        }
    }


    // CADASTRAR CLIENTE
    public UsuarioDTO registerUser(
            String nome,
            String email,
            String endereco,
            String cpf,
            String senha
    ) {


        if (clienteRepository.findByEmail(email).isPresent()) {
            throw new CampoInvalidoexception(
                    "Email já cadastrado!"
            );
        }


        if (clienteRepository.findByCpf(cpf).isPresent()) {
            throw new CampoInvalidoexception(
                    "CPF já cadastrado!"
            );
        }


        Usuario usuario = new Usuario();

        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setEndereco(endereco);
        usuario.setCpf(cpf);
        usuario.setSenha(senha);

        // Todo cadastro pelo admin será cliente
        usuario.setTipo(Usuario.TipoUsuario.CLIENTE);


        Usuario usuarioSalvo = clienteRepository.save(usuario);


        return new UsuarioDTO(
                usuarioSalvo.getId(),
                usuarioSalvo.getNome(),
                usuarioSalvo.getEmail(),
                usuarioSalvo.getEndereco(),
                usuarioSalvo.getCpf()
        );
    }


    // DELETAR USUÁRIO PELO CPF
    public void removeUser(String cpf) {

        Usuario usuario = clienteRepository.findByCpf(cpf)
                .orElseThrow(() ->
                        new CampoInvalidoexception(
                                "Usuário não encontrado!"
                        )
                );


        clienteRepository.delete(usuario);
    }


    // LISTAR TODOS OS USUÁRIOS
    public List<Usuario> listUsers() {

        return clienteRepository.findAll();
    }



    // LISTAR SOMENTE CLIENTES
    public List<Usuario> listClientes() {

        return clienteRepository.findByTipo(
                Usuario.TipoUsuario.CLIENTE
        );
    }


    // BUSCAR USUÁRIO PELO EMAIL (LOGIN FUTURO)
    public Usuario buscarPorEmail(String email) {

        return clienteRepository.findByEmail(email)
                .orElseThrow(() ->
                        new CampoInvalidoexception(
                                "Usuário não encontrado!"
                        )
                );
    }
}