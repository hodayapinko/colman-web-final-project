import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Colman Internet App API",
      version: "1.0.0",
      description: "API documentation for Colman Internet App Assignment",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["username", "email"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID",
              example: "507f1f77bcf86cd799439011",
            },
            username: {
              type: "string",
              description:
                "Unique username (3-30 characters, alphanumeric and underscores)",
              minLength: 3,
              maxLength: 30,
              pattern: "^[a-zA-Z0-9_]+$",
              example: "johndoe123",
            },
            email: {
              type: "string",
              format: "email",
              description: "Unique email address",
              example: "john.doe@example.com",
            },
            password: {
              type: "string",
              description: "User password",
              example: "securePassword123",
            },
            refreshTokens: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of refresh tokens",
              default: [],
            },
            age: {
              type: "number",
              minimum: 0,
              maximum: 150,
              description: "User age",
              example: 28,
            },
            bio: {
              type: "string",
              maxLength: 500,
              description: "User biography",
              example: "Software developer passionate about web technologies",
            },
            profilePicture: {
              type: "string",
              format: "uri",
              description: "URL to user profile picture",
              example: "https://example.com/profile/johndoe.jpg",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when user was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when user was last updated",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "User created successfully",
            },
            data: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        Post: {
          type: "object",
          required: ["title", "content", "user"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID",
              example: "507f1f77bcf86cd799439011",
            },
            title: {
              type: "string",
              description: "Post title (3-200 characters)",
              minLength: 3,
              maxLength: 200,
              example: "Introduction to Node.js",
            },
            content: {
              type: "string",
              description: "Post content (minimum 10 characters)",
              minLength: 10,
              example: "This is a comprehensive guide to getting started with Node.js development.",
            },
            user: {
              type: "string",
              description:
                "Reference to the User who created the post (MongoDB ObjectId)",
              example: "507f1f77bcf86cd799439012",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when post was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when post was last updated",
            },
          },
        },
        Comment: {
          type: "object",
          required: ["content", "postId", "userId"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated MongoDB ID",
              example: "507f1f77bcf86cd799439011",
            },
            content: {
              type: "string",
              description: "Comment content (1-500 characters)",
              minLength: 1,
              maxLength: 500,
              example: "This is a great post! Thanks for sharing.",
            },
            postId: {
              type: "string",
              description: "Reference to the Post (MongoDB ObjectId)",
              example: "507f1f77bcf86cd799439012",
            },
            userId: {
              type: "string",
              description:
                "Reference to the User who created the comment (MongoDB ObjectId)",
              example: "507f1f77bcf86cd799439013",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when comment was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when comment was last updated",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "string",
              example: "Detailed error information",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
