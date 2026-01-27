const fs = require('fs');
const path = require('path');

const swaggerPath = path.resolve(__dirname, 'client/swagger.json');
const swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

// Add Schemas
swagger.components.schemas.AuthResponse = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    user: { $ref: "#/components/schemas/UserResponseDto" }
  },
  required: ["accessToken", "refreshToken", "user"]
};

swagger.components.schemas.RefreshTokenResponse = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" }
  },
  required: ["accessToken", "refreshToken"]
};

// Update Paths
// Login
if (swagger.paths['/auth/login']?.post?.responses['200']) {
  swagger.paths['/auth/login'].post.responses['200'].content = {
    "application/json": {
      schema: { $ref: "#/components/schemas/AuthResponse" }
    }
  };
}

// Signup (Manual returns { id, email })
if (swagger.paths['/auth/signup']?.post?.responses['201']) {
  swagger.paths['/auth/signup'].post.responses['201'].content = {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" }
        }
      }
    }
  };
}

// Verify Email
if (swagger.paths['/auth/email/verify']?.post?.responses['200']) {
  swagger.paths['/auth/email/verify'].post.responses['200'].content = {
    "application/json": {
      schema: { $ref: "#/components/schemas/AuthResponse" }
    }
  };
}

// Refresh Token
if (swagger.paths['/auth/refresh']?.post?.responses['200']) {
  swagger.paths['/auth/refresh'].post.responses['200'].content = {
    "application/json": {
      schema: { $ref: "#/components/schemas/RefreshTokenResponse" }
    }
  };
}

fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
console.log('Swagger JSON patched successfully.');
