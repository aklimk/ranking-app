# Minimilist node+npm filesystem.
FROM node:20-alpine

# Set working directory for temporary build filesystem.
WORKDIR /app

# Copy npm package information.
# npm ci allows for dependency version specification
# and allows docker to better cache an
# "npm dependency layer".
COPY package.json package-lock.json* ./
RUN npm ci

# Copy host files over.
COPY ./ ./

# Run npm build script.
RUN npm run build

# Remove dev dependencies once build has completed.
RUN npm prune --omit=dev

# Use 8000 as internal container port.
EXPOSE 8000
ENV PORT=8000
ENV NODE_ENV=production

# Run npm package.
CMD ["npm", "start"]
