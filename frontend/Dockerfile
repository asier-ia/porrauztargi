FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# We run with --host so Vite binds to all network interfaces, allowing Docker to expose the port.
CMD ["npm", "run", "dev", "--", "--host"]
