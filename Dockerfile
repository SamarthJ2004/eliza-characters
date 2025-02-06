# Dockerfile
FROM --platform=linux/amd64 node:23
# Or specify your exact node version

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy character files and source code
COPY characters/ ./characters/
COPY *.js ./
ENV GROQ_API_KEY=""

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]