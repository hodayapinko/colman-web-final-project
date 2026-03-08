import { findPostById, findUserById } from "../functions";
import Post from "../../../models/Post.model";
import User from "../../../models/User.model";

jest.mock("../../../models/Post.model");
jest.mock("../../../models/User.model");

describe("Shared Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findPostById", () => {
    it("should return a post when found", async () => {
      const mockPost = {
        _id: "post123",
        title: "Test Post",
        content: "Test content",
      };

      (Post.findById as jest.Mock).mockResolvedValue(mockPost);

      const result = await findPostById("post123");

      expect(Post.findById).toHaveBeenCalledWith("post123");
      expect(result).toEqual(mockPost);
    });

    it("should return null when post not found", async () => {
      (Post.findById as jest.Mock).mockResolvedValue(null);

      const result = await findPostById("nonexistent");

      expect(Post.findById).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("should return a user when found", async () => {
      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserById("user123");

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const result = await findUserById("nonexistent");

      expect(User.findById).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });
  });
});
