import { Injectable, BadRequestException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
    });
  }

  async uploadToCloudinary(filePath: string, folder: string): Promise<any> {
    try {
      return await cloudinary.uploader.upload(filePath, { folder });
    } catch (error) {
      throw new BadRequestException(
        `Cloudinary upload failed: ${error.message}`
      );
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadToCloudinary(file.path, folder)
      );
      const results = await Promise.all(uploadPromises);
      return results.map((r) => r.secure_url);
    } catch (error) {
      throw new BadRequestException(
        `Multiple file upload failed: ${error.message}`
      );
    }
  }

  async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }

  async deleteMultiple(media: string[]): Promise<void> {
    try {
      const publicIds = media.map((imgUrl) => {
        const parts = imgUrl.split("/");
        const fileName = parts[parts.length - 1];
        return `posts/${fileName.split(".")[0]}`;
      });
      const deletePromises = publicIds.map((id) =>
        cloudinary.uploader.destroy(id)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      throw new BadRequestException(
        `Multiple image deletion failed: ${error.message}`
      );
    }
  }
}
