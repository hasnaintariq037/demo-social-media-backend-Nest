import { Module } from "@nestjs/common";
import { AuthModule } from "./module/auth/auth.module";
import { UserModule } from "./module/user/user.module";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ServicesModule } from "./services/services.module";
import { PostModule } from "./module/post/post.module";
import { CloudinaryService } from "./services/cloudinary/cloudinary.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("DATABASE_URL"),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ServicesModule,
    PostModule,
  ],
  controllers: [],
  providers: [CloudinaryService],
})
export class AppModule {}
