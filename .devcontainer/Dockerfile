FROM mcr.microsoft.com/devcontainers/base:ubuntu
# Tools: Node LTS, pnpm, git, curl, openssl
ARG NODE_VERSION=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
&& apt-get update \
&& apt-get install -y nodejs jq postgresql-client  \
&& corepack enable \
&& corepack prepare pnpm@latest --activate \
&& npm i -g tsx \
&& apt-get clean && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN type -p curl >/dev/null || apt-get update && apt-get install -y curl \
 && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
 && apt-get update \
 && apt-get install -y gh \
 && apt-get clean && rm -rf /var/lib/apt/lists/*
