FROM mcr.microsoft.com/devcontainers/base:ubuntu
# Tools: Node LTS, pnpm, git, curl, openssl
ARG NODE_VERSION=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
&& apt-get update \
&& apt-get install -y nodejs jq postgresql-client \
&& corepack enable \
&& corepack prepare pnpm@latest --activate \
&& npm i -g tsx \
&& apt-get clean && rm -rf /var/lib/apt/lists/*