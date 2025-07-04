import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ProtectedController],
})
export class ProtectedModule {}