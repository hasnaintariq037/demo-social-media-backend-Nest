import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
    });
  }

  async uploadToCloudinary(
    filePath: string,
    folder: string
  ): Promise<UploadApiResponse> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
    });
    return result;
  }

  async deleteFromCloudinary(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
