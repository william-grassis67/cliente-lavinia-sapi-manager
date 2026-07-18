# ===================================================
# Etapa 1: Build da Aplicação (Multi-stage build)
# ===================================================
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração do Maven primeiro para reaproveitar o cache das dependências
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia o código-fonte da aplicação
COPY src ./src

# Compila o projeto e gera o arquivo .jar ignorando os testes
RUN mvn clean package -DskipTests

# ===================================================
# Etapa 2: Imagem Final de Execução
# ===================================================
FROM eclipse-temurin:21-jre-alpine

# Define o diretório de trabalho na imagem final
WORKDIR /app

# Copia apenas o .jar gerado na etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta que a aplicação vai utilizar
EXPOSE 8080

# Comando para rodar a aplicação Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]