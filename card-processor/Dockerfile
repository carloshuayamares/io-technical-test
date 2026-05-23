FROM node:18-alpine

WORKDIR /app

# Copiar toda la estructura (card-processor, shared, etc)
COPY . .

# Ir a la carpeta del servicio
WORKDIR /app/card-processor

# Instalar dependencias
RUN npm install

# Build
RUN npm run build

# Cambiar WORKDIR para que el app use las rutas correctas
WORKDIR /app

# Ejecutar desde /app/card-processor
CMD ["sh", "-c", "cd card-processor && npm start"]
