# Minimilist node+npm filesystem.
# Save the filesystem under "BUILD"
# to access later from a different filesystem.
FROM node:20-alpine AS BUILD

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


# Import the nginx base image.
FROM nginx:alpine

# Copy nginx config as the default for the container.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove existing files in the nginx html folder.
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from node container into current one.
COPY --from=build /app/dist/ /usr/share/nginx/html/
