FROM node:20

WORKDIR /app

# Copiar toda la estructura (card-issuer, shared, etc)
COPY . .

# Instalar dependencias de la raíz
RUN npm install

# Ir a la carpeta del servicio
WORKDIR /app/card-issuer

# Instalar dependencias del servicio
RUN npm install

# Build
RUN npm run build

# Cambiar WORKDIR para que el app use las rutas correctas
WORKDIR /app

# Ejecutar desde /app/card-issuer
CMD ["sh", "-c", "cd card-issuer && npm start"]
