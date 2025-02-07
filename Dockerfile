FROM --platform=linux/amd64 node:23

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy .env file
COPY .env ./

# Copy character files and source code
COPY characters/ ./characters/
COPY *.js ./

EXPOSE 3000

CMD ["node", "server.js"]